import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import {
  defaultFields,
  TDiscount,
  THeader,
  TProduct,
  TProductCategory,
} from "./product.interface";
import { Product } from "./product.model";
import { TUser } from "../user/user.interface";
import slugify from "slugify";
import Papa from "papaparse";
import fs, { appendFile } from "fs";
import path from "path";
import { Category } from "../category/category.model";
import {
  buildProductQuery,
  claculateSpecialPrice,
  createCategoryArray,
  extractCommonFilters,
  ParsedFilters,
  parseFilters,
  transformSvgProductData,
} from "./product.utils";
import { Brand } from "../brand/brand.model";
import handleDuplicateError from "../../errors/handleDuplicateError";
import { TErrorSourse } from "../../interface/error.interface";
import { ObjectId } from "mongodb";
import mongoose, { Error } from "mongoose";
import { TBulkUploadData } from "../bulkUpload/bulkUpload.interface";
import BulkUpload from "../bulkUpload/bulkUpload.model";
import QueryBuilder from "../../builder/queryBuilder";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
import {
  addNotifications,
  buildNotifications,
} from "../notification/notificaiton.utils";
import ProductFilter from "../productFilters/filter.model";
import { TBrand } from "../brand/brand.interface";
import { TCategory } from "../category/category.interface";
import { getProductsFromRedis } from "./product.redis";
import sift from "sift";
import { ProductJobName, productQueue } from "./product.queue";
import redisClient from "../../../redis";
import { RedisKeys } from "../../interface/common";
import { TProductDetailsCategory } from "../productDetailsCategory/productDetailsCategory.interface";
import Settings from "../settings/settings.model";
import { TProductFilter } from "../productFilters/filter.interface";

const createProductIntoDB = async (
  payload: TProduct,
  email: string,
  thisUser: TUser,
) => {
  const user: TUser | undefined = await User.isUserExistsByEmail(email);

  if (!user._id) {
    throw new AppError(httpStatus.CONFLICT, "Could not find admin information");
  }

  const slug = slugify(payload.name);

  const productData = payload;
  productData.createdBy = user._id;
  productData.slug = slug;
  productData.mainCategory = productData.category?.find(
    (c) => c.main === true,
  )?.id;

  if (payload.discount && payload.discount?.value > 0) {
    productData.special_price = claculateSpecialPrice(
      payload.discount,
      payload.price,
    );
  }

  const result = await Product.create(productData);

  if (result) {
    if (!thisUser || !thisUser._id) {
      return;
    }

    const notifications = await buildNotifications({
      source: result._id,
      text: "added a product",
      thisUser,
      notificationType: "product",
      actionType: "create",
    });

    await addNotifications({ notifications, userFrom: thisUser });
  }

  return result;
};

const getAllProductsFromDB = async (query: Record<string, unknown>) => {
  const searchFields = [
    "name",
    "model",
    "key_features",
    "description",
    "slug",
    "sku",
  ];
  const excludeFields = [
    "searchTerm",
    "page",
    "limit",
    "category",
    "sort",
    "fields",
  ];

  const pagination = {
    total: 0,
    currentPage: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10,
  };

  const limit = pagination.limit;
  const skip = (pagination.currentPage - 1) * limit;

  let result;

  const redisProducts = await getProductsFromRedis();

  if (!redisProducts || redisProducts?.length === 0) {
    if (query.category) {
      query.mainCategory = new ObjectId(query.category as string);
      delete query.categroy;
    }

    if (query.createdBy) {
      query.createdBy = new ObjectId(query.createdBy as string);
    }

    if (query.createdAt) {
      const startOfDay = dayjs(query.createdAt as string)
        .utc()
        .startOf("day")
        .toDate();
      const endOfDay = dayjs(query.createdAt as string)
        .utc()
        .endOf("day")
        .toDate();

      query.createdAt = {
        $gte: startOfDay,
        $lt: endOfDay,
      };
    }

    const productQuery = new QueryBuilder(Product.find(), query)
      .search(searchFields)
      .filter(excludeFields)
      .sort()
      .fields();

    await productQuery.paginate();

    result = await productQuery.modelQuery
      .select("price discount name quantity thumbnail slug")
      .populate([
        {
          path: "brand",
          match: { _id: { $type: "objectId" } },
          select: "name image",
        },
        {
          path: "mainCategory",
          model: "Category",
        },
      ]);

    pagination.total = productQuery.total;

    await productQueue.add(ProductJobName.updateAllProducts, {});
  } else {
    const siftQuery: Record<string, any> = {};

    if (query.searchTerm) {
      siftQuery["$or"] = searchFields.map((field) => ({
        [field]: { $regex: query?.searchTerm, $options: "i" },
      }));
    }

    if (query.category) {
      query.mainCategory = query.category;
      delete query.categroy;
    }

    if (query.createdBy) {
      query.createdBy = query.createdBy;
    }

    let filteredProducts = redisProducts.filter(sift(siftQuery));

    if (query.createdAt) {
      const startOfDay = dayjs(query.createdAt as string)
        .startOf("day")
        .toDate();
      const endOfDay = dayjs(query.createdAt as string)
        .endOf("day")
        .toDate();

      filteredProducts = filteredProducts.filter((item: any) => {
        const createdAt = new Date(item.createdAt);
        return createdAt >= startOfDay && createdAt < endOfDay;
      });
    }

    pagination.total = filteredProducts.length || 0;

    result = filteredProducts.slice(skip, skip + limit);
  }

  return {
    products: result,
    pagination,
  };
};

const getSingleProductFromDB = async (
  id: string,
  query: Record<string, any>,
) => {
  if (!id) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Please provide product id to get details",
    );
  }

  let select = "";

  if (query?.select) {
    select = query.select.split(",").join(" ");
  }

  console.log({ select });

  const product = await Product.findById(id).select(select).lean();

  return product;
};
const getSingleProductBySlugFromDB = async (slug: string) => {
  if (!slug) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Please provide product id to get details",
    );
  }

  const product = await Product.findOne({ slug }).lean();

  const category = product?.mainCategory;

  const allCategories = await Category.find()
    .select("_id name slug parent_id image")
    .lean()
    .exec();
  const categoryMap = new Map(allCategories.map((c) => [c._id.toString(), c]));

  // Function to build category tree using pre-fetched categories
  const buildCategoryTree = (categoryId: string) => {
    const tree = [];

    let currentId = categoryId?.toString();
    while (currentId && categoryMap.has(currentId)) {
      const category = categoryMap.get(currentId);
      if (category) {
        tree.unshift({
          _id: category._id,
          name: category.name,
          slug: category.slug,
        });
        currentId = category.parent_id?.toString();
      }
    }

    // Log warning if a category or parent was not found
    if (currentId && !categoryMap.has(currentId)) {
      console.warn(`Parent category not found for ID: ${currentId}`);
    }

    return tree;
  };

  const breadcrum = buildCategoryTree(category?.toString() as string);

  const relatedProducts = await Product.find({
    "category.id": category,
  })
    .limit(8)
    .lean();

  return {
    product,
    relatedProducts: relatedProducts?.filter((p) => p._id !== product?._id),
    breadcrum,
  };
};

const bulkUploadToDB = async (
  file: Express.Multer.File | undefined,
  mapedFields: THeader[],
  email: string,
) => {
  if (!file) {
    throw new AppError(httpStatus.CONFLICT, "No upload file provided");
  }

  const filePath = path.resolve(file.path);

  const categories = (await Category.find({ isDeleted: false }).lean()).map(
    (cat) => ({
      ...cat,
      _id: cat._id.toString(),
    }),
  );
  const brands = (await Brand.find({ isDeleted: false }).lean()).map(
    (brand) => ({
      ...brand,
      _id: brand._id.toString(),
    }),
  );
  const user: TUser | undefined = await User.isUserExistsByEmail(email);

  const payload: TProduct[] = await new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath);

    Papa.parse(fileStream, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: async (result) => {
        const { data: csvData, errors: csvErrors } = result;

        if (csvErrors.length > 0) {
          reject(new AppError(httpStatus.CONFLICT, "Failed to read file"));
          return;
        }

        const filteredData: TProduct[] = [];

        for (const data of csvData) {
          const newData: Partial<TProduct> = {
            name: "",
            price: 0,
            special_price: 0,
            discount: {
              type: "percent",
              value: 0,
            },
            sku: "",
            brand: "",
            model: "",
            warranty: {
              days: 0,
              lifetime: false,
            },
            key_features: "",
            quantity: 0,
            category: [],
            description: "",
            videos: [],
            gallery: [],
            thumbnail: "",
            slug: "",
            attributes: [],
            meta: {
              title: "",
              description: "",
              image: "",
            },
            tags: [],
            isFeatured: true,
            mainCategory: "",
            shipping: {
              free: true,
              cost: 0,
            },
          };

          for (const field of mapedFields) {
            if (!field.key || !field.value) return;

            if (defaultFields.includes(field.value)) {
              const value =
                typeof data === "object" &&
                (data as Record<string, any>)[field.key];

              if (value !== undefined) {
                if (field.value === "category") {
                  const cat = categories.find(
                    (c) =>
                      c.slug === (data as Record<string, any>)[field.key] ||
                      c._id === (data as Record<string, any>)[field.key],
                  );
                  if (cat) {
                    const productCat = createCategoryArray(categories, cat);
                    newData.category = productCat;
                    newData.mainCategory = cat._id;
                  }
                } else if (field.value === "shipping.cost") {
                  newData.shipping = newData.shipping || {
                    free: false,
                    cost: 0,
                  };
                  newData.shipping.cost = Number(value);
                } else if (field.value === "shipping.free") {
                  newData.shipping = {
                    free: String(value).toLowerCase() == "true" ? true : false,
                    cost: value == "true" ? 0 : newData.shipping?.cost || 0,
                  };
                } else if (field.value === "discount.type") {
                  newData.discount = newData.discount || {
                    type: "flat",
                    value: 0,
                  };
                  newData.discount.type = value;
                } else if (field.value === "discount.value") {
                  newData.discount = {
                    type: newData.discount?.type || "flat",
                    value: value,
                  };
                } else if (field.value === "meta.title") {
                  newData.meta = newData.meta || {
                    title: "",
                    description: "",
                    image: "",
                  };

                  newData.meta.title = value;
                } else if (field.value === "meta.description") {
                  newData.meta = newData.meta || {
                    title: "",
                    description: "",
                    image: "",
                  };

                  newData.meta.description = value;
                } else if (field.value === "meta.image") {
                  newData.meta = newData.meta || {
                    title: "",
                    description: "",
                    image: "",
                  };

                  newData.meta.image = value;
                } else if (field.value === "warranty.days") {
                  ((newData.warranty = newData.warranty || {
                    days: 0,
                    lifetime: false,
                  }),
                    (newData.warranty.days = value));
                } else if (field.value === "warranty.lifetime") {
                  newData.warranty = newData.warranty || {
                    days: 0,
                    lifetime: false,
                  };
                  newData.warranty.lifetime =
                    String(value).toLowerCase() == "true" || "TRUE"
                      ? true
                      : false;
                } else if (field.value in newData) {
                  newData[field.value] = value;
                }

                if (field.value === "brand") {
                  const exist = brands.find(
                    (b) => b.name === value || b._id === value,
                  );

                  if (exist) {
                    newData.brand = exist._id || "add brand";
                  }
                }

                // console.log({ key: field.value, value });

                newData.slug = slugify(newData.name as string);
                newData.sku = slugify(newData.name as string);
                newData.createdBy = user._id;
                newData.special_price = claculateSpecialPrice(
                  newData.discount as TDiscount,
                  Number(newData.price),
                );
              }
            }
          }
          // console.log({ newData });

          filteredData.push(transformSvgProductData(newData) as TProduct);
        }

        resolve(filteredData);
      },
      error: (err) => {
        console.log(err);
        reject(
          new AppError(
            httpStatus.CONFLICT,
            `Error parsing file: ${err.message}`,
          ),
        );
      },
    });
  });

  if (payload.length === 0 || !payload) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Failed to parse data. Pelase map all the fields properly",
    );
  }

  const withError: {
    name: string;
    errorSources: TErrorSourse;
    data: TProduct;
  }[] = [];
  const successData: {
    name: string;
    slug: string;
    sku: string;
    _id: ObjectId;
  }[] = [];

  for (const record of payload) {
    try {
      const res = await Product.create(record);
      if (res) {
        successData.push({
          name: record.name,
          slug: record.slug,
          sku: record.sku,
          _id: res._id,
        });
      }
    } catch (err: any) {
      if (err.code === 11000) {
        const simplifiedError = handleDuplicateError(err);
        withError.push({
          name: record.name,
          errorSources: simplifiedError.errorSources,
          data: record,
        });
      } else if (err instanceof Error.CastError) {
        withError.push({
          name: record.name,
          errorSources: [
            {
              path: err?.path,
              message: err.message || "Failed to create product",
            },
          ],
          data: record,
        });
      } else if (err instanceof Error.ValidationError) {
        const errorSources: TErrorSourse = [];
        Object.keys(err.errors).map((key) => {
          errorSources.push({
            path: key,
            message: err.errors[key].message,
          });
        });

        withError.push({
          name: record.name,
          errorSources,
          data: record,
        });
      } else {
        withError.push({
          name: record.name,
          errorSources: [
            {
              path: "",
              message: "Failed to create product",
            },
          ],
          data: record,
        });
      }
    }
  }

  try {
    const bulkResult = await BulkUpload.create({
      withError,
      successData,
      createdBy: user._id,
    });
  } catch (err) {
    // throw new AppError(httpStatus.CONFLICT, 'Failed to store bulk upload history')
  }

  await productQueue.add(ProductJobName.updateAllProducts, {});

  const result: TBulkUploadData = {
    withError,
    successData,
    createdBy: user._id as ObjectId,
  };

  return result;
};

const bulkUploadJsonToDB = async (
  file: Express.Multer.File | undefined,
  email: string,
): Promise<TBulkUploadData> => {
  if (!file) {
    throw new AppError(httpStatus.CONFLICT, "No upload file provided");
  }

  if (
    !file.mimetype.includes("application/json") &&
    !file.originalname.endsWith(".json")
  ) {
    throw new AppError(httpStatus.CONFLICT, "File must be a JSON file");
  }

  const filePath = path.resolve(file.path);
  const user = await User.isUserExistsByEmail(email);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const categories = (await Category.find({ isDeleted: false }).lean()).map(
    (cat) => ({
      ...cat,
      _id: cat._id.toString(),
    }),
  );
  const brands = (await Brand.find({ isDeleted: false }).lean()).map(
    (brand) => ({
      ...brand,
      _id: brand._id.toString(),
    }),
  );

  let payload: TProduct[] = [];
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(fileContent);

    if (!Array.isArray(jsonData)) {
      throw new AppError(
        httpStatus.CONFLICT,
        "JSON file must contain an array of products",
      );
    }

    payload = jsonData.map((data: any) => {
      const newData: Partial<TProduct> = {
        name: data.name || "",
        price: Number(data.price) || 0,
        special_price: Number(data.special_price) || 0,
        discount: {
          type: data.discount?.type || "percent",
          value: Number(data.discount?.value) || 0,
        },
        filters: data?.filters || [],
        sku: data.sku || slugify(data.name || "", { lower: true }),
        brand: "",
        model: data.model || "",
        warranty: {
          days: Number(data.warranty?.days) || 0,
          lifetime: Boolean(data.warranty?.lifetime) || false,
        },
        key_features: data.key_features || "",
        quantity: Number(data.quantity) || 0,
        category: [],
        description: data.description || "",
        videos: Array.isArray(data.videos) ? data.videos : [],
        gallery: Array.isArray(data.gallery) ? data.gallery : [],
        thumbnail: data.thumbnail || "",
        slug: slugify(data.name || "", { lower: true }),
        attributes: Array.isArray(data.attributes) ? data.attributes : [],
        meta: {
          title: data.meta?.title || "",
          description: data.meta?.description || "",
          image: data.meta?.image || "",
        },
        tags: Array.isArray(data.tags) ? data.tags : [],
        isFeatured: Boolean(data.isFeatured) ?? true,
        mainCategory: "",
        shipping: {
          free: Boolean(data.shipping?.free) ?? true,
          cost: Number(data.shipping?.cost) || 0,
        },
        createdBy: user._id,
        isPublished: Boolean(data.isPublished) ?? true,
        isDeleted: Boolean(data.isDeleted) ?? false,
        sales: Number(data.sales) || 0,
      };

      console.log(data);

      // Handle category
      if (data.category) {
        const cat = categories.find(
          (c) =>
            c.slug.trim() === data.category.trim() ||
            c._id === data.category.trim(),
        );
        if (cat) {
          newData.category = createCategoryArray(categories, cat);
          newData.mainCategory = cat._id;
        } else {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Invalid category: ${data.category}`,
          );
        }
      } else {
        throw new AppError(httpStatus.BAD_REQUEST, "Category is required");
      }

      // Handle brand
      if (data.brand) {
        const exist = brands.find(
          (b) => b.name === data.brand || b._id === data.brand,
        );
        if (exist) {
          newData.brand = exist._id;
        } else {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Invalid brand: ${data.brand}`,
          );
        }
      } else {
        throw new AppError(httpStatus.BAD_REQUEST, "Brand is required");
      }

      return transformSvgProductData(newData) as TProduct;
    });
  } catch (err: any) {
    throw new AppError(httpStatus.CONFLICT, `${err.message}`);
  }

  if (payload.length === 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      "No valid data parsed from the JSON file",
    );
  }

  const withError: {
    name: string;
    errorSources: TErrorSourse;
    data: TProduct;
  }[] = [];
  const successData: {
    name: string;
    slug: string;
    sku: string;
    _id: ObjectId;
  }[] = [];

  for (const record of payload) {
    try {
      const res = await Product.create(record);
      if (res) {
        successData.push({
          name: record.name,
          slug: record.slug,
          sku: record.sku,
          _id: res._id,
        });
      }
    } catch (err: any) {
      if (err.code === 11000) {
        const simplifiedError = handleDuplicateError(err);
        withError.push({
          name: record.name,
          errorSources: simplifiedError.errorSources,
          data: record,
        });
      } else if (err instanceof Error.CastError) {
        withError.push({
          name: record.name,
          errorSources: [
            {
              path: err.path,
              message: err.message || "Failed to create product",
            },
          ],
          data: record,
        });
      } else if (err instanceof Error.ValidationError) {
        const errorSources: TErrorSourse = Object.keys(err.errors).map(
          (key) => ({
            path: key,
            message: err.errors[key].message,
          }),
        );
        withError.push({
          name: record.name,
          errorSources,
          data: record,
        });
      } else {
        withError.push({
          name: record.name,
          errorSources: [
            { path: "", message: err.message || "Failed to create product" },
          ],
          data: record,
        });
      }
    }
  }

  try {
    await BulkUpload.create({
      withError,
      successData,
      createdBy: user._id,
    });
  } catch (err) {
    console.error("Failed to store bulk upload history:", err);
  }

  await productQueue.add(ProductJobName.updateAllProducts, {});

  const result: TBulkUploadData = {
    withError,
    successData,
    createdBy: user._id as ObjectId,
  };

  return result;
};

const downloadJsonTemplate = async ({
  category,
  filters,
}: {
  category?: string;
  filters?: string[];
}) => {
  const attributes: TProduct["attributes"] = [];
  let mainCategory = "";

  if (category && mongoose.isValidObjectId(category)) {
    const data = await Category.findById(category)
      .populate("product_details_categories")
      .lean();

    if (data) {
      mainCategory = data.slug;

      for (const attr of data?.product_details_categories as unknown as TProductDetailsCategory[]) {
        const fields: Record<string, string> = {};

        for (const f of attr?.fields) {
          fields[f] = "";
        }

        attributes.push({
          name: attr.name,
          fields: fields,
        });
      }
    }
  }

  let filterData: any[] = [];

  if (filters) {
    filterData = await ProductFilter.find({ _id: { $in: filters } });
  }

  // Sample product data for the template
  const templateData: any[] = [
    {
      name: "",
      price: 0,
      discount: { type: "percent", value: 0 },
      sku: "",
      brand: "",
      model: "",
      warranty: { days: 0, lifetime: false },
      key_features: "",
      quantity: 0,
      category: mainCategory,
      description: "",
      videos: [],
      filters: filterData.map((f) => ({
        filter: f?._id,
        fitlerId: f.filterId,
        value: "",
      })),
      gallery: [],
      thumbnail: "",
      meta: {
        title: "",
        description: "",
        image: "",
      },
      tags: [],
      isFeatured: true,
      shipping: { free: false, cost: 0 },
      isPublished: true,
      attributes,
    },
  ];

  // Convert to JSON string with formatting
  const jsonContent = JSON.stringify(
    { templateData, filters: filterData },
    null,
    2,
  );

  return jsonContent;
};

const updateProductIntoDB = async (
  id: string,
  payload: Partial<TProduct>,
  thisUser: TUser,
) => {
  if (!id) {
    throw new AppError(httpStatus.FORBIDDEN, "Please provide product id");
  }

  const exist = await Product.findById(id);

  if (!exist) {
    throw new AppError(httpStatus.CONFLICT, "Product does not exist");
  }

  const result = await Product.findByIdAndUpdate(id, payload, { new: true });

  await productQueue.add(ProductJobName.updateSingleProduct, result?._id);

  if (result) {
    if (!thisUser || !thisUser._id) {
      return;
    }

    const notifications = await buildNotifications({
      source: result._id,
      text: "updated a product",
      thisUser,
      notificationType: "product",
      actionType: "update",
    });

    await addNotifications({ notifications, userFrom: thisUser });
  }

  return result;
};

const getFeaturedProductFromDB = async (queryLimit?: string) => {
  const limit = queryLimit ? Number(queryLimit) : 18;

  const products = await Product.find({ isFeatured: true })
    .sort("-updatedAt")
    .limit(Number(limit) || 18);

  return products;
};

const getProductByCategoryFromDB = async (
  slug: string,
  query: Record<string, unknown>,
) => {
  const catExist = await Category.findOne({ slug, isDeleted: false }).select(
    "_id slug name description",
  );
  if (!catExist) {
    throw new AppError(httpStatus.CONFLICT, "Category does not exist");
  }

  const parsedFilters: ParsedFilters = parseFilters(query.filter as any);

  const pagination = {
    total: 0,
    currentPage: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10,
  };

  const categoryQuery = buildProductQuery(
    catExist._id.toString(),
    parsedFilters,
  );

  // Get paginated products
  const products = await Product.find(categoryQuery)
    .select("price discount name quantity thumbnail slug shipping")
    .skip((pagination.currentPage - 1) * pagination.limit)
    .limit(pagination.limit)
    .lean();

  const total = await Product.countDocuments(categoryQuery);

  pagination.total = total;

  const data = {
    products,
    category: catExist,
  };

  return {
    result: data,
    pagination,
  };
};

const getFiltersByCategoryFromDB = async (slug: string) => {
  const catExist = await Category.findOne({ slug, isDeleted: false }).select(
    "_id slug name description",
  );

  if (!catExist) {
    throw new AppError(httpStatus.CONFLICT, "Category does not exist");
  }

  const allCategoryProducts = await Product.find({
    "category.id": catExist._id,
  })
    .select("filters")
    .lean();

  const commonFilters = extractCommonFilters(allCategoryProducts);

  let filters = [];

  for (let filter of commonFilters) {
    const data = await ProductFilter.findById(filter.filter);
    if (data) {
      filters.push(data);
    }
  }

  const data = {
    filters,
    category: catExist,
  };

  return {
    result: data,
  };
};

const getSearchProductsFromDB = async (query: Record<string, unknown>) => {
  const filters: any = {};
  const catFilters: any = {};
  const brandFilters: any = {};
  let sort: any = { createdAt: -1 };

  const getFrom = query.getFrom ? (query.getFrom as string)?.split(",") : [];

  if (query?.search) {
    filters["$or"] = [
      { name: { $regex: query.search, $options: "i" } },
      { model: { $regex: query.search, $options: "i" } },
    ];

    catFilters["$or"] = [{ name: { $regex: query.search, $options: "i" } }];
    brandFilters["$and"] = [{ isDeleted: false }];
    brandFilters["$or"] = [{ name: { $regex: query.search, $options: "i" } }];
    brandFilters["$and"] = [{ isDeleted: false }, { isActive: true }];
  }

  const redisProducts = await getProductsFromRedis();

  let products: TProduct[] = [];

  if (!redisProducts || redisProducts?.length === 0) {
    products = await Product.find(filters)
      .select("slug _id name thumbnail")
      .sort(sort)
      .limit(15);
  } else {
    const filterProducts = redisProducts.filter(sift(filters));
    products = filterProducts.slice(0, 15);
  }

  let categories: TCategory[] = [];

  if (getFrom?.includes("category")) {
    categories = await Category.find(catFilters)
      .select("slug _id name description image")
      .sort(sort)
      .limit(10);
  }

  let brands: TBrand[] = [];

  if (getFrom?.includes("brand")) {
    brands = await Brand.find(brandFilters)
      .select("_id name image")
      .sort(sort)
      .limit(10);
  }

  return {
    products,
    categories,
    brands,
  };
};

const getStaticProductSlugsFromDB = async () => {
  const result = await Product.find({ sort: { createdAt: -1 } })
    .limit(500)
    .select("slug");

  return result;
};

const getPcBuilderProductsFromDB = async (
  id: string,
  query: Record<string, unknown>,
) => {
  const pcBuilderSettings = await Settings.findOne();
  const pcBuilder = pcBuilderSettings?.pcBuilder;

  const page = query?.page ? Number(query.page) : 1;
  const limit = query?.limit ? Number(query?.limit) : 20;

  const skip = (page - 1) * limit;

  if (!pcBuilder) {
    throw new AppError(httpStatus.NOT_FOUND, "PC builder settigns not found");
  }

  const allParts = [
    ...pcBuilder.coreComponents?.parts,
    ...pcBuilder.peripherals?.parts,
  ];

  const partCategory = allParts?.find((p) => p.id.toString() === id)?.category;

  if (!partCategory) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Category for this part not found",
    );
  }

  const categoryQuery = {
    $or: [
      {
        mainCategory: new ObjectId(partCategory),
      },
      {
        "category.id": new ObjectId(partCategory),
      },
    ],
  };

  const filters = await Product.find(categoryQuery).distinct("filters");
  const products = await Product.find(categoryQuery)
    .sort("createdAt")
    .skip(skip)
    .limit(limit);
  const total = await Product.countDocuments(categoryQuery);

  return { products, filters, pagination: { total, currentPage: page, limit } };
};

export const ProductServices = {
  createProductIntoDB,
  getAllProductsFromDB,
  bulkUploadToDB,
  getSingleProductFromDB,
  updateProductIntoDB,
  getFeaturedProductFromDB,
  getProductByCategoryFromDB,
  getSingleProductBySlugFromDB,
  getSearchProductsFromDB,
  downloadJsonTemplate,
  getStaticProductSlugsFromDB,
  bulkUploadJsonToDB,
  getPcBuilderProductsFromDB,
  getFiltersByCategoryFromDB,
};
