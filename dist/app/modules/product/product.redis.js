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
exports.updateSigleProductToRedis = exports.setProductsToRedis = exports.getProductsFromRedis = void 0;
const redis_1 = __importDefault(require("../../../redis"));
const common_1 = require("../../interface/common");
const product_model_1 = require("./product.model");
const EXPIRE_TIME = 86400;
const getProductsFromRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get(common_1.RedisKeys.products));
    if (data) {
        return JSON.parse(data);
    }
    else {
        return [];
    }
});
exports.getProductsFromRedis = getProductsFromRedis;
const setProductsToRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield product_model_1.Product.find().populate([
            {
                path: "mainCategory",
                select: "_id name slug image",
            },
            {
                path: "brand",
            },
            {
                path: "createdBy",
                select: "role fullName name profilePicture email",
                populate: [
                    {
                        path: "role",
                        select: "role",
                    },
                ],
            },
        ]);
        yield redis_1.default.setex(common_1.RedisKeys.products, EXPIRE_TIME, JSON.stringify(res));
    }
    catch (err) {
        console.log("Error saving products to redis", { error: err });
    }
});
exports.setProductsToRedis = setProductsToRedis;
const updateSigleProductToRedis = (id, type) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield product_model_1.Product.findById(id).populate([
            {
                path: "mainCategory",
            },
            {
                path: "brand",
            },
        ]);
        if (product) {
            let products = [];
            const redisData = yield redis_1.default.get(common_1.RedisKeys.products);
            if (redisData) {
                products = JSON.parse(redisData);
                const updatedProduct = type === "delete"
                    ? products.filter((p) => p._id !== id)
                    : products === null || products === void 0 ? void 0 : products.map((p) => {
                        if (p._id.toString() === product._id.toString()) {
                            return product;
                        }
                        else {
                            return p;
                        }
                    });
                yield redis_1.default.setex(common_1.RedisKeys.products, EXPIRE_TIME, JSON.stringify(updatedProduct));
            }
            else {
                yield (0, exports.setProductsToRedis)();
            }
        }
    }
    catch (err) {
        console.log(err);
    }
});
exports.updateSigleProductToRedis = updateSigleProductToRedis;
