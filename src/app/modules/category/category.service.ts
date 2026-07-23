import { Types } from "mongoose";
import { TCategory, TUpdateCategory } from "./category.interface";
import { Category } from "./category.model";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import {
  addNotifications,
  buildNotifications,
} from "../notification/notificaiton.utils";
import {
  sendSourceSocket,
  TSendSourceSocket,
} from "../../utils/sendSourceSocket";
import slugify from "slugify";
import { TUser } from "../user/user.interface";
import { Product } from "../product/product.model";

const createCategoryIntoDB = async (payload: TCategory, admin: TUser) => {
  const parent_id = payload.parent_id || null;

  const slug = payload.slug?.trim() || slugify(payload.name).trim();

  console.log({ payload });

  const exist = await Category.findOne({
    slug,
    isDeleted: false,
  });

  if (exist) {
    throw new AppError(httpStatus.CONFLICT, "Category already exist");
  }

  const result = await Category.create({ ...payload, parent_id, slug });

  if (result) {
    const eventPayload: TSendSourceSocket<typeof result> = {
      payload: {
        data: result,
        actionType: "create",
        sourceType: "category",
      },
      event: "category",
      ignore: [`${admin?._id}`],
    };

    await sendSourceSocket(eventPayload);

    const notifications = await buildNotifications({
      actionType: "create",
      notificationType: "category",
      source: result._id,
      text: "added a category",
      thisUser: admin,
    });

    await addNotifications({ notifications, userFrom: admin });
  }

  return result;
};

const getAllCategoriesFromDB = async () => {
  const categories = await Category.find({ isDeleted: false }).populate([
    {
      path: "product_details_categories",
      select: "-__v",
    },
  ]);

  return categories;
};
const getFeaturedCategoriesFromDB = async () => {
  const categories = await Category.find({ isDeleted: false, isFeatured: true })
    .limit(20)
    .populate([
      {
        path: "product_details_categories",
        select: "-__v",
      },
    ]);

  return categories;
};

const deleteCategoryFromDB = async (id: string, admin: TUser) => {
  const exist = await Category.findById(id);

  if (exist) {
    const result = await Category.findByIdAndUpdate(id, { isDeleted: true });

    const eventPayload: TSendSourceSocket<typeof result> = {
      payload: {
        data: result,
        actionType: "delete",
        sourceType: "category",
      },
      event: "category",
      ignore: [`${admin?._id}`],
    };

    await sendSourceSocket(eventPayload);

    if (result) {
      const notifications = await buildNotifications({
        actionType: "delete",
        notificationType: "category",
        source: result._id,
        text: "deleted a category",
        thisUser: admin,
      });

      await addNotifications({ notifications, userFrom: admin });
    }
    return result;
  } else {
    throw new AppError(httpStatus.CONFLICT, "Categoy does not exist");
  }
};

const updateCategoryIntoDB = async (
  id: string,
  payload: TUpdateCategory,
  admin: TUser,
) => {
  const exist = await Category.findById(id);
  if (exist) {
    const update = await Category.findByIdAndUpdate(
      id,
      { ...payload },
      { new: true },
    );

    console.log(payload);

    if (!update) {
      throw new AppError(httpStatus.CONFLICT, "Failed to update category");
    }

    const result = await Category.findById(id).populate([
      {
        path: "product_details_categories",
        select: "-__v",
      },
    ]);

    const eventPayload: TSendSourceSocket<typeof result> = {
      payload: {
        data: result,
        actionType: "update",
        sourceType: "category",
      },
      event: "category",
      ignore: [`${admin?._id}`],
    };

    await sendSourceSocket(eventPayload);

    if (result) {
      const notifications = await buildNotifications({
        actionType: "update",
        notificationType: "category",
        source: result._id,
        text: "updated a category",
        thisUser: admin,
      });

      await addNotifications({ notifications, userFrom: admin });
    }

    return result;
  } else {
    throw new AppError(httpStatus.CONFLICT, "Categoy does not exist");
  }
};

const getSingleCategoryFromDB = async (id: string) => {
  const result = await Category.findById(id).populate([
    {
      path: "product_details_categories",
      select: "-__v",
    },
  ]);

  if (result === null) {
    throw new AppError(httpStatus.CONFLICT, "Categoy does not exist");
  }

  return result;
};

const getStaticCategorySlugsFromDB = async () => {
  const result = await Category.find({ sort: { createdAt: -1 } })
    .limit(500)
    .select("slug");
  return result;
};

const getDataForSitemapFromDB = async () => {
  const products = await Product.find({
    isDeleted: false,
    isPublished: true,
  }).select("slug updatedAt");

  const categories = await Category.find({ isDeleted: false }).select(
    "slug updatedAt",
  );

  return {
    products,
    categories,
  };
};

const getCatgoryDataBySlugFromDB = async (slug: string) => {
  const catExist = await Category.findOne({ slug, isDeleted: false }).select(
    "_id slug name description",
  );
  if (!catExist) {
    throw new AppError(httpStatus.CONFLICT, "Category does not exist");
  }

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

  const buildChildTree = (categoryId: string) => {
    const tree = [];
    const queue = [categoryId?.toString()];
    const visited = new Set();

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId || visited.has(currentId)) continue;
      visited.add(currentId);

      const category = categoryMap.get(currentId);
      if (!category) {
        console.warn(`Child category not found for ID: ${currentId}`);
        continue;
      }

      if (category._id.toString() !== catExist._id.toString()) {
        tree.push({
          _id: category._id,
          name: category.name,
          slug: category.slug,
          image: category.image,
          description: category?.description,
        });
      }

      // Find all children of the current category
      const children = allCategories.filter(
        (c) => c.parent_id?.toString() === currentId,
      );
      queue.push(...children.map((c) => c._id.toString()));
    }

    return tree;
  };

  const categoryTree = buildCategoryTree(catExist._id.toString());
  const childTree = buildChildTree(catExist._id.toString());

  const data = {
    categoryTree,
    childTree,
    category: catExist,
  };

  return data;
};

export const CategoryServices = {
  createCategoryIntoDB,
  getAllCategoriesFromDB,
  deleteCategoryFromDB,
  updateCategoryIntoDB,
  getSingleCategoryFromDB,
  getFeaturedCategoriesFromDB,
  getStaticCategorySlugsFromDB,
  getDataForSitemapFromDB,
  getCatgoryDataBySlugFromDB,
};
