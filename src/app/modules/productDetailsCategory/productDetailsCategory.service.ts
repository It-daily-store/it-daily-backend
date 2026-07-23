import { TProductDetailsCategory } from "./productDetailsCategory.interface";
import { ProductDetailsCategory } from "./productDetailsCategory.model";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import {
  addNotifications,
  buildNotifications,
} from "../notification/notificaiton.utils";
import { TUser } from "../user/user.interface";

const createProductDetailsCategoryIntoDB = async (
  payload: TProductDetailsCategory,
  admin: TUser
) => {
  const result = await ProductDetailsCategory.create(payload);

  if (result) {
    const notifications = await buildNotifications({
      actionType: "create",
      notificationType: "productDetails",
      source: result._id,
      text: "added a details category",
      thisUser: admin,
    });

    await addNotifications({ notifications, userFrom: admin });
  }

  return result;
};

const updateProductDetailsCategoryIntoDB = async (
  id: string,
  payload: Partial<TProductDetailsCategory>,
  admin: TUser
) => {
  const exist = await ProductDetailsCategory.findOne({ _id: id });

  if (!exist) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Product details category not found"
    );
  }

  const result = await ProductDetailsCategory.findByIdAndUpdate(id, payload, {
    new: true,
  });

  if (result) {
    const notifications = await buildNotifications({
      actionType: "update",
      notificationType: "productDetails",
      source: result._id,
      text: "updated a details category",
      thisUser: admin,
    });

    await addNotifications({ notifications, userFrom: admin });
  }

  return result;
};

const getSingleProductDetailsCategoryFromDB = async (id: string) => {
  const result = await ProductDetailsCategory.findOne({ _id: id });
  return result;
};

const getAllProductDetailsCategoryFromDB = async () => {
  const result = await ProductDetailsCategory.find();
  return result;
};

const deleteProductDetailsCategoryFromDB = async (id: string, admin: TUser) => {
  const result = await ProductDetailsCategory.findByIdAndDelete(id);
  if (result) {
    const notifications = await buildNotifications({
      actionType: "delete",
      notificationType: "productDetails",
      source: result._id,
      text: "deleted a details category",
      thisUser: admin,
    });

    await addNotifications({ notifications, userFrom: admin });
  }
  return result;
};

export const ProductDetailsCategoryServices = {
  createProductDetailsCategoryIntoDB,
  updateProductDetailsCategoryIntoDB,
  getSingleProductDetailsCategoryFromDB,
  getAllProductDetailsCategoryFromDB,
  deleteProductDetailsCategoryFromDB,
};
