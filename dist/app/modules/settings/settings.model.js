"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const pcPartSchema = new mongoose_1.Schema({
    id: {
        type: Number,
        required: true,
        unique: true,
        min: 1000,
        max: 1100,
    },
    name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        ref: "Category",
    },
    isRequired: {
        type: Boolean,
        required: true,
    },
});
const pcCategorySchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
    },
    parts: [pcPartSchema],
});
const pcBuildSchema = new mongoose_1.Schema({
    coreComponents: pcCategorySchema,
    peripherals: pcCategorySchema,
});
const SettingsSchema = new mongoose_1.Schema({
    pcBuilder: pcBuildSchema,
    lastUpdatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
    },
}, { timestamps: true });
const Settings = (0, mongoose_1.model)("Settings", SettingsSchema);
exports.default = Settings;
