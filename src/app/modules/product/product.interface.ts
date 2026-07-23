import { Types } from "mongoose";

export interface TProductCategory {
  main: boolean;
  id: string;
}

export type TProductWarrenty = {
  days: number;
  lifetime: boolean;
};

export type TShipping = {
  free: boolean;
  cost: number;
};

export interface TReview {
  rating: number;
  review: string;
}

export interface TMeta {
  title: string;
  description: string;
  image: string;
}

export type TDiscount = {
  type: "flat" | "percent";
  value: number;
};

export interface TProduct {
  _id: Types.ObjectId;
  id?: string;
  name: string;
  price: number;
  special_price: number;
  discount?: TDiscount;
  sku: string;
  brand: string;
  model?: string;
  warranty: TProductWarrenty;
  reviews?: TReview[];
  key_features: string;
  quantity: number;
  category: TProductCategory[];
  description: string;
  videos?: string[];
  gallery?: string[];
  thumbnail: string;
  slug: string;
  attributes?: { name: string; fields: Record<string, string> }[];
  filters: { filter: string; fitlerId: string; value: string }[];
  meta?: TMeta;
  tags?: string[];
  isFeatured?: boolean;
  isPublished?: boolean;
  isDeleted?: boolean;
  mainCategory?: string;
  sales?: number;
  createdBy: Types.ObjectId;
  shipping: TShipping;
}

export type TPagination = {
  limit: number;
  currentPage: number;
  total: number;
  totalPage?: number;
  hasMore?: boolean;
};

export const defaultFields: string[] = [
  "name",
  "price",
  "discount.type",
  "discount.value",
  "sku",
  "brand",
  "model",
  "warranty.days",
  "warranty.lifetime",
  "key_features",
  "quantity",
  "category",
  "description",
  "thumbnail",
  "meta.title",
  "meta.description",
  "meta.image",
  "tags",
  "shipping.free",
  "shipping.cost",
];

export type THeader = {
  key: string;
  value:
    | "name"
    | "price"
    | "discount.type"
    | "discount.value"
    | "sku"
    | "brand"
    | "model"
    | "warranty.days"
    | "warranty.lifetime"
    | "key_features"
    | "quantity"
    | "category"
    | "description"
    | "thumbnail"
    | "meta.title"
    | "meta.description"
    | "meta.image"
    | "tags"
    | "shipping.free"
    | "shipping.cost";
};
