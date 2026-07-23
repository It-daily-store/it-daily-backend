import {z} from "zod";
import {EAppFeatures} from "./roles.interface";

const TCrudSchema = z.object({
  read: z.boolean().default(false),
  create: z.boolean().default(false),
  update: z.boolean().default(false),
  delete: z.boolean().default(false),
});

const TPermissionSchema = z.object({
  feature: z.nativeEnum(EAppFeatures),
  access: TCrudSchema,
});

const createRoleValidationSchema = z.object({
  role: z.string({required_error: "Role name is required"}).min(1, "Role name is required"),
  description: z.string({invalid_type_error: "Descriptio should be string"}).max(400, "Description can't be more than 400 characters").optional(),
  permissions: z.array(TPermissionSchema).optional(),
});

const updateRoleValidationSchema = z.object({
  role: z.string({required_error: "Role name is required"}).min(1, "Role name is required").optional(),
  description: z.string({invalid_type_error: "Descriptio should be string"}).max(400, "Description can't be more than 400 characters").optional(),
  permissions: z.array(TPermissionSchema).optional(),
});

export const RolesValidations = {
  createRoleValidationSchema,
  updateRoleValidationSchema,
};
