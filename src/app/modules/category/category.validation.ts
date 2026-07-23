import { z } from "zod";

const createCategoryValidationSchema = z.object({
  name: z
    .string({
      required_error: "Category name is required",
      invalid_type_error: "Category name should be a string",
    })
    .toLowerCase(),
  parent_id: z
    .string({
      invalid_type_error: "Parent categroy id should be a string",
    })
    .nullable()
    .optional(),
  product_details_categories: z.array(z.string(), {
    required_error: "Product details category is required",
    invalid_type_error:
      "Product details category should be an array of strings",
  }),
  slug: z.string({ invalid_type_error: "Slug has to be a string" }).optional(),
  description: z
    .string({ invalid_type_error: "Description has to be a string" })
    .optional(),
  // .min(1, "A category should have at least one product details category"),
});

const updateCategoryValidationSchema = z.object({
  name: z
    .string({
      required_error: "Category name is required",
      invalid_type_error: "Category name should be a string",
    })
    .toLowerCase(),
  product_details_categories: z.array(z.string(), {
    required_error: "Product details category is required",
    invalid_type_error:
      "Product details category should be an array of strings",
  }),
  description: z
    .string({ invalid_type_error: "Description has to be a string" })
    .optional(),
});

export const CategoryValidations = {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
};
