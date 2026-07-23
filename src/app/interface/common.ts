import { TNotification } from "../modules/notification/notification.interface";

export type TSingleSourceResponse<T> = {
  data: T;
  actionType: TNotification["actionType"];
  sourceType: TNotification["notificationType"];
};

export enum RedisKeys {
  products = "products",
  deals = "deals",
  email = "email",
}
