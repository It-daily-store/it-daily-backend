"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidations = void 0;
const zod_1 = require("zod");
const NameValidationSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, { message: "First name is required" }),
    middleName: zod_1.z.string().optional().nullable(),
    lastName: zod_1.z.string().min(1, { message: "Last name is required" }),
});
// Zod schema for TAddress
const AddressValidationSchema = zod_1.z.object({
    street: zod_1.z.string().optional().nullable(),
    city: zod_1.z.string().optional().nullable(),
    state: zod_1.z.string().optional().nullable(),
    postalCode: zod_1.z.string().optional().nullable(),
    country: zod_1.z.string().optional().nullable(),
});
const createUserValidationSchema = zod_1.z.object({
    password: zod_1.z
        .string({
        required_error: "Password is required",
        invalid_type_error: "Password must be a string",
    })
        .min(6, "Password must be at least 6 characters"),
    role: zod_1.z
        .string({
        required_error: "User role is required",
    })
        .min(1, "Role cannot be empty string"),
    address: AddressValidationSchema.optional(),
    email: zod_1.z
        .string({ required_error: "Email is required" })
        .email({ message: "Invalid email address" }),
    name: NameValidationSchema,
    phoneNumber: zod_1.z.string().optional(),
});
exports.UserValidations = {
    createUserValidationSchema,
};
