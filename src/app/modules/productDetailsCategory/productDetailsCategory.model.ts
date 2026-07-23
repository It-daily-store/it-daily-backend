import {model, Schema} from "mongoose";
import {TProductDetailsCategory} from "./productDetailsCategory.interface";

const ProductDetailsCategorySchema = new Schema<TProductDetailsCategory>({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase:true
  },
  fields: {
    type: [String],
    required: true,
  },
});

export const ProductDetailsCategory = model<TProductDetailsCategory>("ProductDetailsCategory", ProductDetailsCategorySchema);
