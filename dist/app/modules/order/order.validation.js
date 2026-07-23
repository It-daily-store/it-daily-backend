"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = __importDefault(require("zod"));
const addressSchema = zod_1.default.object({
    address: zod_1.default.string().min(1, "Address is required").trim(),
    city: zod_1.default.string().min(1, "City is required").trim(),
    district: zod_1.default.string().min(1, "District is required").trim(),
});
const productSchema = zod_1.default.object({
    id: zod_1.default.string().min(1, "District is required").trim(),
    quantity: zod_1.default.number().int().positive("Quantity must be a positive integer"),
});
const createOrderValidationSchema = zod_1.default.object({
    products: zod_1.default
        .array(productSchema)
        .min(1, "At least one product is required")
        .refine((products) => {
        // Check for duplicate product IDs
        const ids = products.map((p) => p.id.toString());
        return new Set(ids).size === ids.length;
    }, "Duplicate products are not allowed"),
    billingAddress: addressSchema,
    shippingAddress: addressSchema,
    paymentMethod: zod_1.default.enum(["card", "paypal", "bank_transfer", "cod"], {
        errorMap: () => ({ message: "Invalid payment method" }),
    }),
    shippingMethod: zod_1.default.enum(["standard", "express", "overnight"], {
        errorMap: () => ({ message: "Invalid shipping method" }),
    }),
    notes: zod_1.default.string().max(500, "Notes cannot exceed 500 characters").optional(),
    saveAddress: zod_1.default.boolean().optional(),
});
const orderValidations = {
    createOrderValidationSchema,
};
exports.default = orderValidations;
