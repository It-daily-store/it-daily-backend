import { Model } from "mongoose";

export enum EAppModules {
  gallery = "gallery",
  role = "role",
  product = "product",
  productDetails = "productDetails",
  category = "category",
  photo = "photo",
  user = "user",
  brand = "brand",
  bulkUpload = "bulkUpload",
  productFilter = "productFilter",
  deals = "deals",
  settings = "settings",
  orders = "orders",
  banner = "banner",
}

export interface TModulePermission {
  module: EAppModules;
  permissions: Record<string, boolean>;
}

export interface TRole {
  role: string;
  description?: string;
  permissions: TModulePermission[];
  isDeleted?: boolean;
}

export interface TRoleModel extends Model<TRole> {
  isRoleExist(id: string): Promise<TRole>;
}
