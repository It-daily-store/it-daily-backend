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
exports.validateCustomer = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const config_1 = __importDefault(require("../config"));
const user_model_1 = require("../modules/user/user.model");
const verifyToken_1 = __importDefault(require("../utils/verifyToken"));
const validateAuth = () => {
    return (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const token = req.headers.authorization;
        if (!token) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized", "unauthorized access request");
        }
        // check if varified user
        const decoded = (0, verifyToken_1.default)(token, config_1.default.access_secret);
        if (!decoded) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized", "unauthorized access request");
        }
        const userExist = yield user_model_1.User.isUserExistsByEmail(decoded.email, true);
        req.user = {
            userRole: userExist.role,
            email: userExist.email,
            id: userExist._id,
            userData: userExist,
        };
        next();
    }));
};
const validateCustomer = () => {
    return (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        if (req.user.userRole !== "customer") {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are not a customer");
        }
        next();
    }));
};
exports.validateCustomer = validateCustomer;
exports.default = validateAuth;
