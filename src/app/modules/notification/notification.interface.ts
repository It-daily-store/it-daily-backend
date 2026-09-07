import { Types } from "mongoose";

export type TNotificationType =
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

export type TNotificationAction = "update" | "create" | "delete";

export type TNotificationMeta = {
  entityName?: string;
  orderNumber?: string;
  orderStatus?: string;
};

export type TNotification = {
  userTo: Types.ObjectId;
  userFrom: Types.ObjectId;
  opened: boolean;
  notificationType: TNotificationType;
  actionType: TNotificationAction;
  source?: string;
  meta?: TNotificationMeta;
};
