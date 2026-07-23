"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductDetailsCategoryValidations = void 0;
const zod_1 = require("zod");
const createProductDetailsCategoryValidationSchema = zod_1.z.object({
    name: zod_1.z.string({
        required_error: "product details category name is required",
        invalid_type_error: "product details category name should be a string",
    }),
    fields: zod_1.z.array(zod_1.z.string({
        required_error: "At least one field is required",
        invalid_type_error: "Fields should be an array of objects",
    }))
        .min(1, { message: "At least one field is required" }),
});
const updateProductDetailsCategoryValidationSchema = zod_1.z.object({
    name: zod_1.z.string({
        invalid_type_error: "product details category name should be a string",
    }).optional(),
    fields: zod_1.z.array(zod_1.z.string({
        invalid_type_error: "Fields should be an array of objects",
    }))
        .min(1, { message: "At least one field is required" }).optional(),
});
exports.ProductDetailsCategoryValidations = {
    createProductDetailsCategoryValidationSchema,
    updateProductDetailsCategoryValidationSchema
};
