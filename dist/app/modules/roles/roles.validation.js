"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesValidations = void 0;
const zod_1 = require("zod");
const roles_interface_1 = require("./roles.interface");
const TCrudSchema = zod_1.z.object({
    read: zod_1.z.boolean().default(false),
    create: zod_1.z.boolean().default(false),
    update: zod_1.z.boolean().default(false),
    delete: zod_1.z.boolean().default(false),
});
const TPermissionSchema = zod_1.z.object({
    feature: zod_1.z.nativeEnum(roles_interface_1.EAppFeatures),
    access: TCrudSchema,
});
const createRoleValidationSchema = zod_1.z.object({
    role: zod_1.z.string({ required_error: "Role name is required" }).min(1, "Role name is required"),
    description: zod_1.z.string({ invalid_type_error: "Descriptio should be string" }).max(400, "Description can't be more than 400 characters").optional(),
    permissions: zod_1.z.array(TPermissionSchema).optional(),
});
const updateRoleValidationSchema = zod_1.z.object({
    role: zod_1.z.string({ required_error: "Role name is required" }).min(1, "Role name is required").optional(),
    description: zod_1.z.string({ invalid_type_error: "Descriptio should be string" }).max(400, "Description can't be more than 400 characters").optional(),
    permissions: zod_1.z.array(TPermissionSchema).optional(),
});
exports.RolesValidations = {
    createRoleValidationSchema,
    updateRoleValidationSchema,
};
