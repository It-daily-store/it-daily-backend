"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterValidations = void 0;
const zod_1 = require("zod");
const createFilterValidationSchema = zod_1.z.object({
    title: zod_1.z
        .string({
        required_error: "Filter title is required",
        invalid_type_error: "Filter title should be string",
    })
        .min(1, "Filter title is required"),
    options: zod_1.z
        .array(zod_1.z.string({
        required_error: "At least one option is required",
        invalid_type_error: "Options should be an array of objects",
    }))
        .min(1, { message: "At least one option is required" }),
});
const updateFilterValidationSchema = zod_1.z.object({
    title: zod_1.z
        .string({
        invalid_type_error: "Filter title should be string",
    })
        .min(1, "Filter title is required")
        .optional(),
    options: zod_1.z
        .array(zod_1.z.object({
        optionId: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
        value: zod_1.z.string(),
    }))
        .min(1, { message: "At least one option is required" })
        .optional(),
});
exports.filterValidations = {
    createFilterValidationSchema,
    updateFilterValidationSchema,
};
