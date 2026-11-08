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
import { toSlug } from "../../utils/slug";
import { TUser } from "../user/user.interface";
import { Product } from "../product/product.model";
import {
  cached,
  invalidateProductCache,
  PRODUCT_TTL,
} from "../../utils/productCache";

const createCategoryIntoDB = async (payload: TCategory, admin: TUser) => {
  const parent_id = payload.parent_id || null;

  const slug = payload.slug?.trim() || toSlug(payload.name);

  const exist = await Category.findOne({
    slug,
    isDeleted: false,
  });

  if (exist) {
    throw new AppError(httpStatus.CONFLICT, "Category already exist");
  }

  const result = await Category.create({ ...payload, parent_id, slug });

  invalidateProductCache();

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
      meta: { entityName: result.name },
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

    invalidateProductCache();

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
        meta: { entityName: result.name },
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

    invalidateProductCache();

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
        meta: { entityName: result.name },
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
  const result = await Category.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(500)
    .select("slug")
    .lean();
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
  const allCategories = await Category.find({ isDeleted: false })
    .select("_id name slug parent_id image description")
    .lean();

  const catExist = allCategories.find((c) => c.slug === slug);
  if (!catExist) {
    throw new AppError(httpStatus.CONFLICT, "Category does not exist");
  }

  const byId = new Map(allCategories.map((c) => [c._id.toString(), c]));
  const childrenOf = new Map<string, typeof allCategories>();
  for (const c of allCategories) {
    const parentId = c.parent_id?.toString();
    if (parentId) {
      childrenOf.set(parentId, [...(childrenOf.get(parentId) ?? []), c]);
    }
  }

  const categoryTree = [];
  const seenAncestors = new Set<string>();
  let currentId: string | undefined = catExist._id.toString();
  while (currentId && !seenAncestors.has(currentId) && byId.has(currentId)) {
    seenAncestors.add(currentId);
    const category: (typeof allCategories)[number] = byId.get(currentId)!;
    categoryTree.unshift({
      _id: category._id,
      name: category.name,
      slug: category.slug,
    });
    currentId = category.parent_id?.toString();
  }

  const childTree = [];
  const visited = new Set<string>([catExist._id.toString()]);
  const queue = [...(childrenOf.get(catExist._id.toString()) ?? [])];
  while (queue.length > 0) {
    const category = queue.shift()!;
    const id = category._id.toString();
    if (visited.has(id)) continue;
    visited.add(id);
    childTree.push({
      _id: category._id,
      name: category.name,
      slug: category.slug,
      image: category.image,
    });
    queue.push(...(childrenOf.get(id) ?? []));
  }

  return {
    categoryTree,
    childTree,
    category: {
      _id: catExist._id,
      slug: catExist.slug,
      name: catExist.name,
      description: catExist.description,
    },
  };
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
  getCatgoryDataBySlugFromDB: (slug: string) =>
    cached("categoryBySlug", { slug }, PRODUCT_TTL, () =>
      getCatgoryDataBySlugFromDB(slug),
    ),
};
