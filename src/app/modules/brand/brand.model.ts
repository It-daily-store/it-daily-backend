import { model, Schema } from "mongoose";
import { TBrand, TBrandModel } from "./brand.interface";

const brandSchema = new Schema<TBrand>({
  image: {
    type: String,
    default: "",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  createdBy: {
    type: String,
    required: true,
    ref: "User",
  },
});

brandSchema.statics.findBrandByName = async (name: string) => {
  const exists = await Brand.findOne({ name });

  if (!exists) {
    return false;
  } else if (exists.isDeleted) {
    return false;
  } else {
    return true;
  }
};

brandSchema.statics.findBrandById = async (id: string) => {
  const res = await Brand.findById(id);

  return res;
};

brandSchema.index({ name: 1 });

export const Brand = model<TBrand, TBrandModel>("Brand", brandSchema);
