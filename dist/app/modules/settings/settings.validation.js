"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsValidationSchema = void 0;
const zod_1 = require("zod");
const PcPartSchema = zod_1.z.object({
    id: zod_1.z.number().min(1000).max(1100),
    name: zod_1.z.string().min(1, "Name is required"),
    category: zod_1.z.string(),
    isRequired: zod_1.z.boolean(),
});
const PcCategorySchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    parts: zod_1.z.array(PcPartSchema),
});
const PcBuildSettingsSchema = zod_1.z.object({
    coreComponents: PcCategorySchema,
    peripherals: PcCategorySchema,
});
const UpdateSettingsSchema = zod_1.z.object({
    pcBuilder: PcBuildSettingsSchema,
});
exports.SettingsValidationSchema = {
    UpdateSettingsSchema,
};
