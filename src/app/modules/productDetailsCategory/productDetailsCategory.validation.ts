import {z} from "zod";

const createProductDetailsCategoryValidationSchema = z.object({
  name: z.string({
    required_error: "product details category name is required",
    invalid_type_error: "product details category name should be a string",
  }),
  fields: z.array(
    z.string({
      required_error: "At least one field is required",
      invalid_type_error: "Fields should be an array of objects",
    }))
    .min(1,{message:"At least one field is required"}),
});

const updateProductDetailsCategoryValidationSchema = z.object({
  name: z.string({
    invalid_type_error: "product details category name should be a string",
  }).optional(),
  fields: z.array(
    z.string({
      invalid_type_error: "Fields should be an array of objects",
    }))
    .min(1,{message:"At least one field is required"}).optional(),
});

export const ProductDetailsCategoryValidations = {
  createProductDetailsCategoryValidationSchema,
  updateProductDetailsCategoryValidationSchema
};
