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
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const user_model_1 = require("../modules/user/user.model");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const roles_model_1 = require("../modules/roles/roles.model");
const checkPermission = (feature, accessType) => {
    return (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const userExist = yield user_model_1.User.isUserExistsByEmail(user === null || user === void 0 ? void 0 : user.email);
        if (!userExist) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Unauthorized user request");
        }
        if (userExist.isMasterAdmin) {
            return next();
        }
        if (userExist.isDeleted) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Your account was deleted", "unauthorized access request");
        }
        if (!userExist.isActive) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Your account is blocked", "unauthorized access request");
        }
        const role = yield roles_model_1.Roles.findById(userExist.role);
        if (!role || role.isDeleted) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Unauthorized user request");
        }
        const permission = role.permissions.find((p) => p.feature === feature);
        const hasPermission = (permission === null || permission === void 0 ? void 0 : permission.access[accessType]) === true;
        if (!hasPermission) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, `You do not have permission to ${accessType} ${feature}`);
        }
        else {
            next();
        }
    }));
};
exports.default = checkPermission;
