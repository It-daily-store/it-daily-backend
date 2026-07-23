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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const user_model_1 = require("../user/user.model");
const roles_interface_1 = require("./roles.interface");
const roles_model_1 = require("./roles.model");
const createRoleIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield roles_model_1.Roles.create(payload);
    return result;
});
const getAllRolesFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield roles_model_1.Roles.find({ isDeleted: false });
    return result;
});
const updateRoleIntoDB = (payload, email, id) => __awaiter(void 0, void 0, void 0, function* () {
    const ThisUser = yield user_model_1.User.isUserExistsByEmail(email);
    if (!ThisUser) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "User does not exist");
    }
    if (ThisUser.role === id && !ThisUser.isMasterAdmin) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You can't update your own role");
    }
    const thisRole = yield roles_model_1.Roles.isRoleExist(id);
    if (!thisRole) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Role does not exist");
    }
    const defaultPermissions = Object.values(roles_interface_1.EAppFeatures).map((feature) => ({
        feature,
        access: {
            read: false,
            create: false,
            update: false,
            delete: false,
        },
    }));
    const newPermissions = defaultPermissions === null || defaultPermissions === void 0 ? void 0 : defaultPermissions.map((permission) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const payloadPermission = payload.permissions.find((p) => p.feature === permission.feature);
        const existingPermission = thisRole.permissions.find(p => p.feature === permission.feature);
        if (payloadPermission && Object.values(roles_interface_1.EAppFeatures).includes(payloadPermission.feature)) {
            return {
                feature: permission.feature,
                access: {
                    read: (_a = payloadPermission.access.read) !== null && _a !== void 0 ? _a : permission.access.read,
                    create: (_b = payloadPermission.access.create) !== null && _b !== void 0 ? _b : permission.access.create,
                    update: (_c = payloadPermission.access.update) !== null && _c !== void 0 ? _c : permission.access.update,
                    delete: (_d = payloadPermission.access.delete) !== null && _d !== void 0 ? _d : permission.access.delete,
                },
            };
        }
        else if (existingPermission && Object.values(roles_interface_1.EAppFeatures).includes(existingPermission.feature)) {
            return {
                feature: permission.feature,
                access: {
                    read: (_e = existingPermission.access.read) !== null && _e !== void 0 ? _e : permission.access.read,
                    create: (_f = existingPermission.access.create) !== null && _f !== void 0 ? _f : permission.access.create,
                    update: (_g = existingPermission.access.update) !== null && _g !== void 0 ? _g : permission.access.update,
                    delete: (_h = existingPermission.access.delete) !== null && _h !== void 0 ? _h : permission.access.delete,
                },
            };
        }
        else {
            return {
                feature: permission.feature,
                access: permission.access,
            };
        }
    });
    const result = yield roles_model_1.Roles.findByIdAndUpdate(id, {
        role: payload.role,
        description: payload.description,
        $set: { permissions: newPermissions },
    }, { new: true });
    return result;
});
const deleteRoleFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const thisRole = yield roles_model_1.Roles.isRoleExist(id);
    if (!thisRole) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Role does not exist");
    }
    const result = yield roles_model_1.Roles.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    return result;
});
exports.RolesService = {
    createRoleIntoDB,
    getAllRolesFromDB,
    updateRoleIntoDB,
    deleteRoleFromDB,
};
