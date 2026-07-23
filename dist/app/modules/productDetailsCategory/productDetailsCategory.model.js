"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductDetailsCategory = void 0;
const mongoose_1 = require("mongoose");
const ProductDetailsCategorySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    fields: {
        type: [String],
        required: true,
    },
});
exports.ProductDetailsCategory = (0, mongoose_1.model)("ProductDetailsCategory", ProductDetailsCategorySchema);
