"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const flashSaleSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, "Sale title is required"],
        trim: true,
        maxlength: [200, "Sale title cannot exceed 200 characters"],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, "Sale description cannot exceed 1000 characters"],
    },
    image: {
        type: String,
        trim: true,
    },
    products: [
        {
            productId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Product",
                required: [true, "Product ID is required"],
            },
            discount: {
                type: {
                    type: String,
                    enum: ["percent", "flat"],
                    required: [true, "Discount type is required"],
                },
                value: {
                    type: Number,
                    required: [true, "Discount value is required"],
                    min: [0, "Discount value must be positive"],
                },
            },
            dealStock: {
                type: Number,
                min: [0, "Sale stock cannot be negative"],
            },
        },
    ],
    startTime: {
        type: Date,
        required: [true, "Sale start time is required"],
    },
    endTime: {
        type: Date,
        required: [true, "Sale end time is required"],
        validate: {
            validator: function (value) {
                return value > this.startTime;
            },
            message: "End time must be after start time",
        },
    },
    isActive: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
// Indexes for better query performance
flashSaleSchema.index({ isActive: 1, startTime: 1, endTime: 1 });
flashSaleSchema.index({ "products.productId": 1 });
// Virtual to check if sale is currently running
flashSaleSchema.virtual("isRunning").get(function () {
    const now = new Date();
    return this.isActive && this.startTime <= now && this.endTime >= now;
});
// Pre-save middleware to validate sale dates
flashSaleSchema.pre("save", function (next) {
    if (this.startTime >= this.endTime) {
        return next(new Error("Start time must be before end time"));
    }
    next();
});
const FlashSale = (0, mongoose_1.model)("FlashSale", flashSaleSchema);
exports.default = FlashSale;
