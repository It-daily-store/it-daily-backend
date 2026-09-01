import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { TBrand } from "./brand.interface";
import { Brand } from "./brand.model";
import { Product } from "../product/product.model";
import { User } from "../user/user.model";
import { TUser } from "../user/user.interface";
import {
  addNotifications,
  buildNotifications,
} from "../notification/notificaiton.utils";

const createBrandIntoDB = async (
  payload: TBrand,
  email: string,
  admin: TUser
) => {
  const exists = await Brand.findBrandByName(payload.name);
  const user: TUser | null = await User.findOne({ email });

  if (exists) {
    throw new AppError(httpStatus.CONFLICT, "Brand already exists");
  }

  const result = await Brand.create({ ...payload, createdBy: user?._id });

  if (result) {
    const notifications = await buildNotifications({
      source: result._id,
      actionType: "create",
      notificationType: "brand",
      text: "added a brand",
      thisUser: admin,
    });

    await addNotifications({ notifications, userFrom: admin });
  }

  return result;
};

const updateBrandIntoDB = async (
  id: string,
  payload: Partial<TBrand>,
  admin: TUser
) => {
  const exists = await Brand.findBrandById(id);

  if (!exists) {
    throw new AppError(httpStatus.CONFLICT, "Brand does not exists");
  }

  delete payload.isDeleted;

  const result = await Brand.findByIdAndUpdate(id, payload, { new: true });

  if (result) {
    const notifications = await buildNotifications({
      source: result._id,
      actionType: "update",
      notificationType: "brand",
      text: "updated a brand",
      thisUser: admin,
    });

    await addNotifications({ notifications, userFrom: admin });
  }

  return result;
};

const getAllBrandsFromDB = async () => {
  const result = await Brand.find({ isDeleted: false }).populate([
    {
      path: "createdBy",
      select: "email name profilePicture name role",
      populate: [
        {
          path: "role",
          select: "role _id",
        },
      ],
    },
  ]);

  return result;
};

const deleteBrandFromDB = async (id: string, admin: TUser) => {
  const exists = await Brand.findBrandById(id);

  if (!exists) {
    throw new AppError(httpStatus.CONFLICT, "Brand does not exists");
  }

  const result = await Brand.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );

  if (result) {
    const notifications = await buildNotifications({
      source: result._id,
      actionType: "delete",
      notificationType: "brand",
      text: "deleted a brand",
      thisUser: admin,
    });

    await addNotifications({ notifications, userFrom: admin });
  }

  return result;
};

const getStorefrontBrandsFromDB = async () => {
  const brands = await Brand.find({ isDeleted: false, isActive: true })
    .select("name image")
    .sort("name")
    .lean();

  const counts = await Product.aggregate([
    { $match: { isDeleted: false, isPublished: true } },
    { $group: { _id: "$brand", total: { $sum: 1 } } },
  ]);

  const countMap = new Map<string, number>(
    counts.map((c) => [String(c._id), c.total as number])
  );

  // Brands with nothing to sell would be dead ends on the storefront.
  return brands
    .map((brand) => ({
      ...brand,
      productCount: countMap.get(String(brand._id)) || 0,
    }))
    .filter((brand) => brand.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount);
};

export const BrandService = {
  createBrandIntoDB,
  updateBrandIntoDB,
  getAllBrandsFromDB,
  getStorefrontBrandsFromDB,
  deleteBrandFromDB,
};
