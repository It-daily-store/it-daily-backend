"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductValidations = exports.createProductValidationSchema = void 0;
const zod_1 = require("zod");
// Define the product category schema
const ProductCategorySchema = zod_1.z.object({
    main: zod_1.z.boolean({ required_error: "Main category flag is required" }),
    id: zod_1.z.string({ required_error: "Category ID is required" }),
});
// const ReviewSchema = z.object({
//     rating: z.number({ required_error: "Review rating is required" }),
//     review: z.string({ required_error: "Review text is required" })
// });
const MetaSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    image: zod_1.z.string().optional(),
});
// Define the main product schema
exports.createProductValidationSchema = zod_1.z.object({
    name: zod_1.z.string({ required_error: "Product name is required" }),
    price: zod_1.z.number({ required_error: "Product price is required" }),
    discount: zod_1.z
        .object({
        type: zod_1.z.string().optional(),
        value: zod_1.z.number().optional(),
    })
        .optional(),
    sku: zod_1.z.string({ required_error: "Product SKU is required" }),
    brand: zod_1.z.string({ required_error: "Product brand is required" }),
    model: zod_1.z.string().optional(),
    warranty: zod_1.z.object({
        days: zod_1.z.number(),
        lifetime: zod_1.z.boolean(),
    }),
    // reviews: z.array(ReviewSchema).optional(),
    key_features: zod_1.z.string({ required_error: "Key features are required" }),
    quantity: zod_1.z.number({ required_error: "Product quantity is required" }),
    category: zod_1.z
        .array(ProductCategorySchema)
        .min(1, "At least one product category is required"),
    description: zod_1.z.string({ required_error: "Product description is required" }),
    videos: zod_1.z.array(zod_1.z.string()).optional(),
    gallery: zod_1.z.array(zod_1.z.string()).optional(),
    thumbnail: zod_1.z
        .string({ required_error: "Product thumbnail is required" })
        .optional(),
    attributes: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        fields: zod_1.z.record(zod_1.z.string(), zod_1.z.string()),
    })),
    meta: MetaSchema.optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    isFeatured: zod_1.z.boolean().optional(),
    sales: zod_1.z.number().optional(),
    createdBy: zod_1.z.string({ required_error: "Creator information is required" }),
});
exports.ProductValidations = {
    createProductValidationSchema: exports.createProductValidationSchema,
};
