import { z } from "zod";
import { EAppModules } from "./roles.interface";
import { ALL_PERMISSION_KEYS } from "./roles.permissions";

const TModulePermissionSchema = z.object({
  module: z.nativeEnum(EAppModules),
  permissions: z.record(z.string(), z.boolean()).refine(
    (value) => Object.keys(value).every((key) => ALL_PERMISSION_KEYS.has(key)),
    (value) => ({
      message: `Unknown permission key: ${Object.keys(value)
        .filter((key) => !ALL_PERMISSION_KEYS.has(key))
        .join(", ")}`,
    }),
  ),
});

const createRoleValidationSchema = z.object({
  role: z
    .string({ required_error: "Role name is required" })
    .min(1, "Role name is required"),
  description: z
    .string({ invalid_type_error: "Description should be string" })
    .max(400, "Description can't be more than 400 characters")
    .optional(),
  permissions: z.array(TModulePermissionSchema).optional(),
});

const updateRoleValidationSchema = z.object({
  role: z
    .string({ required_error: "Role name is required" })
    .min(1, "Role name is required")
    .optional(),
  description: z
    .string({ invalid_type_error: "Description should be string" })
    .max(400, "Description can't be more than 400 characters")
    .optional(),
  permissions: z.array(TModulePermissionSchema).optional(),
});

export const RolesValidations = {
  createRoleValidationSchema,
  updateRoleValidationSchema,
};
