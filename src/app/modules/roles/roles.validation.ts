import { z } from "zod";
import { EAppModules } from "./roles.interface";
import { PERMISSION_CATALOG } from "./roles.permissions";

const TModulePermissionSchema = z
  .object({
    module: z.nativeEnum(EAppModules),
    permissions: z.record(z.string(), z.boolean()),
  })
  .superRefine((entry, ctx) => {
    const valid = new Set<string>(
      PERMISSION_CATALOG[entry.module].map((d) => d.key),
    );
    const unknown = Object.keys(entry.permissions).filter((key) => !valid.has(key));
    if (unknown.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Unknown permission key for module ${entry.module}: ${unknown.join(", ")}`,
      });
    }
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
