import { Types } from "mongoose";

export interface IAddress {
  address: string;
  city: string;
  district: string;
  user?: Types.ObjectId;
}
