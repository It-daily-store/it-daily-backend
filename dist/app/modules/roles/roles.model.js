"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Roles = void 0;
const mongoose_1 = require("mongoose");
const roles_interface_1 = require("./roles.interface");
const PermissionsSchema = new mongoose_1.Schema({
    feature: {
        type: String,
        enum: Object.values(roles_interface_1.EAppFeatures),
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
const RolesSchema = new mongoose_1.Schema({
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
        default: Object.values(roles_interface_1.EAppFeatures).map((feature) => ({
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
    const role = this;
    const defaultPermissions = Object.values(roles_interface_1.EAppFeatures).map((feature) => ({
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
RolesSchema.statics.isRoleExist = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return exports.Roles.findById(id);
});
exports.Roles = (0, mongoose_1.model)("Roles", RolesSchema);
