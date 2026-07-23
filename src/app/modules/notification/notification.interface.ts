import { Types } from "mongoose";
import { EAppFeatures } from "../roles/roles.interface";

export type TNotification = {
  userTo: Types.ObjectId;
  userFrom: Types.ObjectId;
  opened: boolean;
  notificationType:
    | "order"
    | "address"
    | "gallery"
    | "role"
    | "product"
    | "productDetails"
    | "category"
    | "photo"
    | "user"
    | "brand"
    | "bulkUpload"
    | "productFilter";
  text: string;
  source?: string;
  actionType: "update" | "create" | "delete";
};
