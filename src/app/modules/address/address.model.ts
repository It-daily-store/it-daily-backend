import { model, Schema } from "mongoose";
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
    label: {
      type: String,
      enum: ["home", "office", "other"],
      default: "home",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true }
);

addressSchema.index({ user: 1, isDefault: -1, createdAt: -1 });

const Address = model<IAddress>("Address", addressSchema);

export default Address;
