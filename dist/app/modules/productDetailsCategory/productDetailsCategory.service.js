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
exports.ProductDetailsCategoryServices = void 0;
const productDetailsCategory_model_1 = require("./productDetailsCategory.model");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const notificaiton_utils_1 = require("../notification/notificaiton.utils");
const createProductDetailsCategoryIntoDB = (payload, admin) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield productDetailsCategory_model_1.ProductDetailsCategory.create(payload);
    if (result) {
        const notifications = yield (0, notificaiton_utils_1.buildNotifications)({
            actionType: "create",
            notificationType: "productDetails",
            source: result._id,
            text: "added a details category",
            thisUser: admin,
        });
        yield (0, notificaiton_utils_1.addNotifications)({ notifications, userFrom: admin });
    }
    return result;
});
const updateProductDetailsCategoryIntoDB = (id, payload, admin) => __awaiter(void 0, void 0, void 0, function* () {
    const exist = yield productDetailsCategory_model_1.ProductDetailsCategory.findOne({ _id: id });
    if (!exist) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product details category not found");
    }
    const result = yield productDetailsCategory_model_1.ProductDetailsCategory.findByIdAndUpdate(id, payload, {
        new: true,
    });
    if (result) {
        const notifications = yield (0, notificaiton_utils_1.buildNotifications)({
            actionType: "update",
            notificationType: "productDetails",
            source: result._id,
            text: "updated a details category",
            thisUser: admin,
        });
        yield (0, notificaiton_utils_1.addNotifications)({ notifications, userFrom: admin });
    }
    return result;
});
const getSingleProductDetailsCategoryFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield productDetailsCategory_model_1.ProductDetailsCategory.findOne({ _id: id });
    return result;
});
const getAllProductDetailsCategoryFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield productDetailsCategory_model_1.ProductDetailsCategory.find();
    return result;
});
const deleteProductDetailsCategoryFromDB = (id, admin) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield productDetailsCategory_model_1.ProductDetailsCategory.findByIdAndDelete(id);
    if (result) {
        const notifications = yield (0, notificaiton_utils_1.buildNotifications)({
            actionType: "delete",
            notificationType: "productDetails",
            source: result._id,
            text: "deleted a details category",
            thisUser: admin,
        });
        yield (0, notificaiton_utils_1.addNotifications)({ notifications, userFrom: admin });
    }
    return result;
});
exports.ProductDetailsCategoryServices = {
    createProductDetailsCategoryIntoDB,
    updateProductDetailsCategoryIntoDB,
    getSingleProductDetailsCategoryFromDB,
    getAllProductDetailsCategoryFromDB,
    deleteProductDetailsCategoryFromDB,
};
