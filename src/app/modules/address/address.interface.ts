import { Types } from "mongoose";

export type TAddressLabel = "home" | "office" | "other";

export interface IAddress {
  address: string;
  city: string;
  district: string;
  label?: TAddressLabel;
  isDefault?: boolean;
  user?: Types.ObjectId;
}
