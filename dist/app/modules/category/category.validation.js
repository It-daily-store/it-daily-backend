"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryValidations = void 0;
const zod_1 = require("zod");
const createCategoryValidationSchema = zod_1.z.object({
    name: zod_1.z
        .string({
        required_error: "Category name is required",
        invalid_type_error: "Category name should be a string",
    })
        .toLowerCase(),
    parent_id: zod_1.z
        .string({
        invalid_type_error: "Parent categroy id should be a string",
    })
        .nullable()
        .optional(),
    product_details_categories: zod_1.z.array(zod_1.z.string(), {
        required_error: "Product details category is required",
        invalid_type_error: "Product details category should be an array of strings",
    }),
    slug: zod_1.z.string({ invalid_type_error: "Slug has to be a string" }).optional(),
    description: zod_1.z
        .string({ invalid_type_error: "Description has to be a string" })
        .optional(),
    // .min(1, "A category should have at least one product details category"),
});
const updateCategoryValidationSchema = zod_1.z.object({
    name: zod_1.z
        .string({
        required_error: "Category name is required",
        invalid_type_error: "Category name should be a string",
    })
        .toLowerCase(),
    product_details_categories: zod_1.z.array(zod_1.z.string(), {
        required_error: "Product details category is required",
        invalid_type_error: "Product details category should be an array of strings",
    }),
    description: zod_1.z
        .string({ invalid_type_error: "Description has to be a string" })
        .optional(),
});
exports.CategoryValidations = {
    createCategoryValidationSchema,
    updateCategoryValidationSchema,
};
