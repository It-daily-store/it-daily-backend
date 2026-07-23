import { Types } from "mongoose";
import { TProduct } from "../product/product.interface";

export interface IFlashSale {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  image?: string;
  products: {
    productId: Types.ObjectId;
    discount: TProduct["discount"];
    dealStock?: number;
  }[];
  startTime: Date;
  lastUpdatedBy: Types.ObjectId;
  endTime: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
