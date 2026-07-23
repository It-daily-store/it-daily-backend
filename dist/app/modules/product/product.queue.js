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
exports.productQueue = exports.ProductJobName = void 0;
const bullmq_1 = require("bullmq");
const common_1 = require("../../interface/common");
const product_redis_1 = require("./product.redis");
const redisConnection = {
    connection: {
        url: process.env.REDIS_URL, // ✅ use Railway's Redis URL
    },
};
var ProductJobName;
(function (ProductJobName) {
    ProductJobName["updateAllProducts"] = "updateAllProducts";
    ProductJobName["updateSingleProduct"] = "updateSingleProduct";
})(ProductJobName || (exports.ProductJobName = ProductJobName = {}));
exports.productQueue = new bullmq_1.Queue(common_1.RedisKeys.products, redisConnection);
const productWorker = new bullmq_1.Worker(common_1.RedisKeys.products, (job) => __awaiter(void 0, void 0, void 0, function* () {
    // sync all products with redis
    if (job.name === ProductJobName.updateAllProducts) {
        yield (0, product_redis_1.setProductsToRedis)();
    }
    // sync single product update
    else if (job.name === ProductJobName.updateSingleProduct) {
        console.log("productid", job.data);
        yield (0, product_redis_1.updateSigleProductToRedis)(job.data, "update");
    }
}), redisConnection);
productWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed!`);
});
productWorker.on("failed", (job, err) => {
    console.log(`Job ${job === null || job === void 0 ? void 0 : job.id} failed: ${err.message}`);
});
