import {model, Schema} from "mongoose";
import {EAppFeatures, TPermission, TRole, TRoleModel} from "./roles.interface";

const PermissionsSchema = new Schema<TPermission>({
  feature: {
    type: String,
    enum: Object.values(EAppFeatures),
    required: [true, "Feature name is required"],
  },
  access: {
    read: {
      type: Boolean,
      default: false,
    },
    create: {
      type: Boolean,
      default: false,
    },
    update: {
      type: Boolean,
      default: false,
    },
    delete: {
      type: Boolean,
      default: false,
    },
  },
});

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
    default: Object.values(EAppFeatures).map((feature) => ({
      feature: feature,
      access: {
        read: false,
        create: false,
        update: false,
        delete: false,
      },
    })),
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

RolesSchema.pre("save", function (next) {
  const role = this as TRole;

  const defaultPermissions: TPermission[] = Object.values(EAppFeatures).map((feature) => ({
    feature: feature,
    access: {
      read: false,
      create: false,
      update: false,
      delete: false,
    },
  }));

  const modifiedPermissions = defaultPermissions.map((dPermission) => {
    const providedPermission = role.permissions.find((p) => p.feature === dPermission.feature);

    return providedPermission ? providedPermission : dPermission;
  });

  role.permissions = modifiedPermissions;
  next();
});

RolesSchema.statics.isRoleExist = async (id: string) => {
  return Roles.findById(id);
};

export const Roles = model<TRole, TRoleModel>("Roles", RolesSchema);
