import { model, Schema } from "mongoose";
import {
  EAppModules,
  TModulePermission,
  TRole,
  TRoleModel,
} from "./roles.interface";

const PermissionsSchema = new Schema<TModulePermission>(
  {
    module: {
      type: String,
      enum: Object.values(EAppModules),
      required: [true, "Module name is required"],
    },
    permissions: {
      type: Map,
      of: Boolean,
      default: {},
    },
  },
  { _id: false },
);

const RolesSchema = new Schema<TRole>({
  role: {
    type: String,
    required: [true, "Role is required"],
    unique: true,
  },
  description: {
    type: String,
    default: "",
  },
  permissions: {
    type: [PermissionsSchema],
    default: () =>
      Object.values(EAppModules).map((module) => ({ module, permissions: {} })),
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

// Guarantee one entry per module without materialising unsupplied keys —
// an absent key already means denied.
RolesSchema.pre("save", function (next) {
  const role = this as unknown as TRole;
  const supplied = role.permissions ?? [];

  role.permissions = Object.values(EAppModules).map((module) => {
    const existing = supplied.find((p) => p.module === module);
    return existing ?? { module, permissions: {} };
  });

  next();
});

RolesSchema.statics.isRoleExist = async (id: string) => {
  return Roles.findById(id);
};

export const Roles = model<TRole, TRoleModel>("Roles", RolesSchema);
