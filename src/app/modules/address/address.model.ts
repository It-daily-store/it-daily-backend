import mongoose, { model, Schema } from "mongoose";
import { IAddress } from "./address.interface";

const addressSchema = new Schema<IAddress>(
  {
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Address = model<IAddress>("Address", addressSchema);

export default Address;
