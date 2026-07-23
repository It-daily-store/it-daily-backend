"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandValidationSchema = void 0;
const zod_1 = require("zod");
const createBrandValidationSchema = zod_1.z.object({
    name: zod_1.z.string({ required_error: 'Brand name is required', invalid_type_error: 'Brand name should be string' }),
    image: zod_1.z.string().optional(),
});
const updateBrandValidationSchema = zod_1.z.object({
    name: zod_1.z.string({ required_error: 'Brand name is required', invalid_type_error: 'Brand name should be string' }).optional(),
    image: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional()
});
exports.BrandValidationSchema = {
    createBrandValidationSchema,
    updateBrandValidationSchema
};
