import { Types } from "mongoose";
import { TProduct } from "../product/product.interface";

export interface IDeal {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  image?: string;
  products: {
    productId: Types.ObjectId;
    discount: TProduct["discount"];
    dealStock?: number;
  }[];
  createdBy: Types.ObjectId;
  lastUpdatedBy: Types.ObjectId;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
