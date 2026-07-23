"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealValidationSchema = void 0;
const zod_1 = require("zod");
const createDealSchema = zod_1.z
    .object({
    title: zod_1.z.string().min(3, "Title must be at least 3 characters"),
    description: zod_1.z.string().min(5, "Description must be at least 5 characters"),
    startTime: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid start time",
    }),
    endTime: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid end time",
    }),
    image: zod_1.z.string().url("Invalid image URL"),
})
    .refine((data) => new Date(data.startTime) > new Date(), {
    message: "Start time cannot be in the past",
    path: ["startTime"],
})
    .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time cannot be before start time",
    path: ["endTime"],
});
exports.DealValidationSchema = {
    createDealSchema,
};
