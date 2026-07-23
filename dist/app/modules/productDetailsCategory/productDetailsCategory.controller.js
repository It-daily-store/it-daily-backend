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
exports.ProductDetailsCategoryControllers = void 0;
const productDetailsCategory_service_1 = require("./productDetailsCategory.service");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const createProductDetailsCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body;
    const { userData } = req.user;
    const result = yield productDetailsCategory_service_1.ProductDetailsCategoryServices.createProductDetailsCategoryIntoDB(payload, userData);
    (0, sendResponse_1.default)(res, {
        data: result,
        statusCode: http_status_1.default.OK,
        success: true,
        message: "succesfull created product details category",
    });
}));
const updateProductDetailsCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const payload = req.body;
    const { userData } = req.user;
    const result = yield productDetailsCategory_service_1.ProductDetailsCategoryServices.updateProductDetailsCategoryIntoDB(id, payload, userData);
    (0, sendResponse_1.default)(res, {
        data: result,
        statusCode: http_status_1.default.OK,
        success: true,
        message: "succesfull updated product details category",
    });
}));
const getSingleProductDetailsCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const result = yield productDetailsCategory_service_1.ProductDetailsCategoryServices.getSingleProductDetailsCategoryFromDB(id);
    (0, sendResponse_1.default)(res, {
        data: result,
        statusCode: http_status_1.default.OK,
        success: true,
        message: "succesfull retrived product details category",
    });
}));
const getAllProductDetailsCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield productDetailsCategory_service_1.ProductDetailsCategoryServices.getAllProductDetailsCategoryFromDB();
    (0, sendResponse_1.default)(res, {
        data: result,
        statusCode: http_status_1.default.OK,
        success: true,
        message: "succesfull retrived all product details categories",
    });
}));
const deleteProductDetailsCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const { userData } = req.user;
    const result = yield productDetailsCategory_service_1.ProductDetailsCategoryServices.deleteProductDetailsCategoryFromDB(id, userData);
    (0, sendResponse_1.default)(res, {
        data: result,
        statusCode: http_status_1.default.OK,
        success: true,
        message: "succesfull deleted product details category",
    });
}));
exports.ProductDetailsCategoryControllers = {
    createProductDetailsCategory,
    updateProductDetailsCategory,
    getSingleProductDetailsCategory,
    getAllProductDetailsCategory,
    deleteProductDetailsCategory,
};
