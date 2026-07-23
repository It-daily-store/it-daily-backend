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
exports.BrandService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const brand_model_1 = require("./brand.model");
const user_model_1 = require("../user/user.model");
const notificaiton_utils_1 = require("../notification/notificaiton.utils");
const createBrandIntoDB = (payload, email, admin) => __awaiter(void 0, void 0, void 0, function* () {
    const exists = yield brand_model_1.Brand.findBrandByName(payload.name);
    const user = yield user_model_1.User.findOne({ email });
    if (exists) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Brand already exists");
    }
    const result = yield brand_model_1.Brand.create(Object.assign(Object.assign({}, payload), { createdBy: user === null || user === void 0 ? void 0 : user._id }));
    if (result) {
        const notifications = yield (0, notificaiton_utils_1.buildNotifications)({
            source: result._id,
            actionType: "create",
            notificationType: "brand",
            text: "added a brand",
            thisUser: admin,
        });
        yield (0, notificaiton_utils_1.addNotifications)({ notifications, userFrom: admin });
    }
    return result;
});
const updateBrandIntoDB = (id, payload, admin) => __awaiter(void 0, void 0, void 0, function* () {
    const exists = yield brand_model_1.Brand.findBrandById(id);
    if (!exists) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Brand does not exists");
    }
    delete payload.isDeleted;
    const result = yield brand_model_1.Brand.findByIdAndUpdate(id, payload, { new: true });
    if (result) {
        const notifications = yield (0, notificaiton_utils_1.buildNotifications)({
            source: result._id,
            actionType: "update",
            notificationType: "brand",
            text: "updated a brand",
            thisUser: admin,
        });
        yield (0, notificaiton_utils_1.addNotifications)({ notifications, userFrom: admin });
    }
    return result;
});
const getAllBrandsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield brand_model_1.Brand.find({ isDeleted: false }).populate([
        {
            path: "createdBy",
            select: "email name profilePicture name role",
            populate: [
                {
                    path: "role",
                    select: "role _id",
                },
            ],
        },
    ]);
    return result;
});
const deleteBrandFromDB = (id, admin) => __awaiter(void 0, void 0, void 0, function* () {
    const exists = yield brand_model_1.Brand.findBrandById(id);
    if (!exists) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Brand does not exists");
    }
    const result = yield brand_model_1.Brand.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (result) {
        const notifications = yield (0, notificaiton_utils_1.buildNotifications)({
            source: result._id,
            actionType: "delete",
            notificationType: "brand",
            text: "deleted a brand",
            thisUser: admin,
        });
        yield (0, notificaiton_utils_1.addNotifications)({ notifications, userFrom: admin });
    }
    return result;
});
exports.BrandService = {
    createBrandIntoDB,
    updateBrandIntoDB,
    getAllBrandsFromDB,
    deleteBrandFromDB,
};
