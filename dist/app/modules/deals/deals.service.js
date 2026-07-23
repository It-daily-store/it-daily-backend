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
exports.DealsServices = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const deals_model_1 = __importDefault(require("./deals.model"));
const redis_1 = __importDefault(require("../../../redis"));
const common_1 = require("../../interface/common");
const product_model_1 = require("../product/product.model");
const mongodb_1 = require("mongodb");
const product_redis_1 = require("../product/product.redis");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const deal_queue_1 = require("./deal.queue");
const sift_1 = __importDefault(require("sift"));
const product_queue_1 = require("../product/product.queue");
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
dayjs_1.default.extend(utc_1.default);
function toUTC(dateStr) {
    const date = new Date(dateStr);
    // Date object stores UTC internally
    return date.toISOString(); // always in UTC
}
const createDealToDb = (data, user) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = {
        title: data.title,
        description: data.description,
        endTime: data.endTime ? toUTC(data.endTime) : undefined,
        startTime: data.startTime ? toUTC(data.startTime) : undefined,
        image: data.image,
        createdBy: user,
        lastUpdatedBy: user,
        isActive: false,
    };
    const result = yield deals_model_1.default.create(payload);
    yield deal_queue_1.dealQueue.add(deal_queue_1.DealJobName.updateAllDeals, {});
    return result;
});
const addProductsToDealToDB = (data, user, deal) => __awaiter(void 0, void 0, void 0, function* () {
    const dealExist = yield deals_model_1.default.findById(deal);
    if (!dealExist) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Could not find deal");
    }
    if (new Date(dealExist.endTime) < new Date()) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Deal has already ended. cannot add product now");
    }
    const existingProductIds = dealExist.products.map((p) => p.productId.toString());
    const newProductsOnly = data.filter((reqProduct) => !existingProductIds.includes(reqProduct.productId.toString()));
    if (newProductsOnly.length === 0) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Found no new products to add");
    }
    let products = [];
    let notFoundProducts = 0;
    const redisData = yield redis_1.default.get(common_1.RedisKeys.products);
    if (redisData !== null) {
        const redisProducts = JSON.parse(redisData);
        for (const reqProduct of newProductsOnly) {
            const exist = redisProducts.find((p) => p._id.toString() === reqProduct.productId.toString());
            if (exist) {
                products.push(reqProduct);
            }
            else {
                notFoundProducts++;
            }
        }
    }
    else {
        const databaseProducts = yield product_model_1.Product.find({
            _id: { $in: newProductsOnly.map((p) => new mongodb_1.ObjectId(p.productId)) },
        }).lean();
        for (const reqProduct of newProductsOnly) {
            const exist = databaseProducts.find((p) => p._id.toString() === reqProduct.productId.toString());
            if (exist) {
                products.push(reqProduct);
            }
            else {
                notFoundProducts++;
            }
        }
        yield (0, product_redis_1.setProductsToRedis)();
    }
    if (products.length === 0) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "No valid new products to add");
    }
    // Append new valid products to existing ones
    const updatedProducts = [...dealExist.products, ...products];
    const result = yield deals_model_1.default.findByIdAndUpdate(deal, { products: updatedProducts, lastUpdatedBy: user }, { new: true });
    yield deal_queue_1.dealQueue.add(deal_queue_1.DealJobName.updateAllDeals, {});
    yield product_queue_1.productQueue.add(product_queue_1.ProductJobName.updateAllProducts, {});
    return {
        products: result === null || result === void 0 ? void 0 : result.products,
        notFoundProducts,
        addedProducts: products.length,
    };
});
const getAllDealsFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;
    const seachQuery = {};
    if (query.search !== "") {
        seachQuery["title"] = { $regex: query.search, $options: "i" };
    }
    const catchData = yield redis_1.default.get(common_1.RedisKeys.deals);
    let total = 0;
    let result = [];
    if (catchData !== null) {
        const data = JSON.parse(catchData) || [];
        const filteredData = data.filter((0, sift_1.default)(seachQuery)) || [];
        total = filteredData.length;
        result = filteredData === null || filteredData === void 0 ? void 0 : filteredData.slice(skip, skip + limit);
    }
    else {
        result = yield deals_model_1.default.find(seachQuery)
            .populate([
            {
                path: "products.productId",
                select: "slug name thumbnail price mainCategory",
            },
            {
                path: "createdBy",
                select: "fullName profilePicture email role",
                populate: {
                    path: "role",
                    select: "role",
                },
            },
            {
                path: "lastUpdatedBy",
                select: "fullName profilePicture email role",
                populate: {
                    path: "role",
                    select: "role",
                },
            },
        ])
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        total = Number(deals_model_1.default.countDocuments(seachQuery));
        yield deal_queue_1.dealQueue.add(deal_queue_1.DealJobName.updateAllDeals, {});
    }
    return {
        deals: result,
        pagination: {
            total,
            currentPage: page,
            limit,
        },
    };
});
const getDealByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const deal = yield deals_model_1.default.findById(id).populate("products.productId", "name slug thumbnail price discount");
    if (!deal) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Could not find deal");
    }
    return deal;
});
const getProductsForDealFromDB = (id, query) => __awaiter(void 0, void 0, void 0, function* () {
    const page = (query === null || query === void 0 ? void 0 : query.page) ? Number(query.page) : 1;
    const limit = (query === null || query === void 0 ? void 0 : query.limit) ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;
    // let deal: IDeal | null;
    let products = [];
    let conflictingDeals = [];
    let total = 0;
    const deal = yield deals_model_1.default.findById(id);
    if (!deal) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Could not find");
    }
    if (new Date(deal.endTime) < new Date()) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Deal has ended cannot add product");
    }
    conflictingDeals = yield deals_model_1.default.find({
        _id: { $ne: id },
        isActive: true,
        $or: [
            {
                startTime: { $lte: deal.endTime },
                endTime: { $gte: deal.startTime },
            },
        ],
    }).lean();
    const conflictingProductIds = conflictingDeals
        .flatMap((d) => d.products.map((p) => p.productId))
        .filter(Boolean);
    const currentDealProductIds = deal.products
        .map((p) => p.productId)
        .filter(Boolean);
    const dbQuery = {
        _id: {
            $nin: [...currentDealProductIds, ...conflictingProductIds],
        },
        isPublished: true,
        isDeleted: false,
    };
    if (query.search) {
        dbQuery["name"] = { $regex: query.search, $options: "i" };
    }
    products = yield product_model_1.Product.find(dbQuery)
        .select("name slug _id mainCategory createdBy thumbnail")
        .populate("mainCategory", "name slug") // Adjust fields as needed
        .populate("createdBy", "name email") // Adjust fields as needed
        .skip(skip)
        .limit(limit)
        .lean();
    total = yield product_model_1.Product.countDocuments(dbQuery);
    return {
        products,
        pagination: {
            currentPage: page,
            limit: limit,
            total,
        },
    };
});
const updateDealToDB = (id, user, data) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Could not find deal");
    }
    const { title, description, startTime, endTime, image } = data;
    let deal;
    const redisDeals = yield redis_1.default.get(common_1.RedisKeys.deals);
    if (redisDeals !== null) {
        const deals = JSON.parse(redisDeals);
        deal = deals.find((d) => d._id.toString() === id);
    }
    else {
        deal = yield deals_model_1.default.findById(id);
        yield deal_queue_1.dealQueue.add(deal_queue_1.DealJobName.updateAllDeals, {});
    }
    if (!deal) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Could not find deal");
    }
    const now = (0, dayjs_1.default)().utc();
    if (startTime) {
        const newStartTime = (0, dayjs_1.default)(startTime).utc();
        const dealStartTime = (0, dayjs_1.default)(deal.startTime).utc();
        const newEndTime = endTime
            ? (0, dayjs_1.default)(endTime).utc()
            : (0, dayjs_1.default)(deal.endTime).utc();
        if (newStartTime.isAfter(newEndTime)) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Start date cannot be before end date and time");
        }
        if (newStartTime.isBefore(now)) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Cannot set past date as start date and time");
        }
        if (deal.isActive && !newStartTime.isSame(dealStartTime, "minute")) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Cannot change start time of an active deal");
        }
    }
    if (endTime) {
        const newStartTime = startTime
            ? (0, dayjs_1.default)(startTime).utc()
            : (0, dayjs_1.default)(deal.startTime).utc(); // string in UTC
        const newEndTime = (0, dayjs_1.default)(endTime).utc();
        if (newEndTime.isBefore(now)) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Cannot set past date as end date and time");
        }
        if (newEndTime.isBefore(newStartTime)) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "End date cannot be before start date and time");
        }
    }
    const result = yield deals_model_1.default.findByIdAndUpdate(id, {
        title,
        description,
        image,
        lastUpdatedBy: user,
        startTime,
        endTime,
    }, { new: true });
    yield deal_queue_1.dealQueue.add(deal_queue_1.DealJobName.updateAllDeals, {});
    return result;
});
// }
exports.DealsServices = {
    createDealToDb,
    addProductsToDealToDB,
    getAllDealsFromDB,
    getDealByIdFromDB,
    getProductsForDealFromDB,
    updateDealToDB,
};
