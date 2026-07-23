"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminValidations = void 0;
const zod_1 = require("zod");
const AdminNameValidationSchema = zod_1.z.object({
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
const CreateAdminValidationSchema = zod_1.z.object({
    address: AddressValidationSchema.optional(),
    email: zod_1.z.string({ required_error: "Email is required" }).email({ message: "Invalid email address" }),
    name: AdminNameValidationSchema,
    role: zod_1.z.string({ required_error: "Role is required" }).min(1, { message: "Role is required" }),
    phoneNumber: zod_1.z.string().optional()
});
exports.AdminValidations = {
    CreateAdminValidationSchema
};
