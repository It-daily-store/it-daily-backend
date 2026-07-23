"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatValidationSchema = void 0;
const zod_1 = require("zod");
const createChatValidationSchema = zod_1.z.object({
    title: zod_1.z
        .string({ required_error: "Chat title is required" })
        .trim()
        .min(1, "Chat title is requred"),
    participants: zod_1.z
        .array(zod_1.z.string({
        required_error: "At least one participants is required",
        invalid_type_error: "Participants should be an array of objects",
    }), { required_error: "Participants is required" })
        .min(1, { message: "At least one participants is required" }),
});
exports.chatValidationSchema = { createChatValidationSchema };
