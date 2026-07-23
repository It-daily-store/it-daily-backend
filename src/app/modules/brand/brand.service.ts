import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { TBrand } from "./brand.interface";
import { Brand } from "./brand.model";
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

export const BrandService = {
  createBrandIntoDB,
  updateBrandIntoDB,
  getAllBrandsFromDB,
  deleteBrandFromDB,
};
