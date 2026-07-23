"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const mongoose_1 = require("mongoose");
const CategorySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Category name is required"],
    },
    slug: {
        type: String,
        required: [true, "Category slug is required"],
        // unique: true,
    },
    parent_id: {
        type: String,
        default: null,
        ref: "Category",
    },
    product_details_categories: {
        type: [String],
        // validate: {
        //   validator: (value: string[]) => {
        //     return value.length > 0;
        //   },
        //   message: "At least one product detail category is required",
        // },
        ref: "ProductDetailsCategory",
        default: [],
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
}, { timestamps: true });
CategorySchema.index({ name: 1 });
exports.Category = (0, mongoose_1.model)("Category", CategorySchema);
