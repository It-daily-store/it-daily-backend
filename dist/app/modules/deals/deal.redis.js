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
exports.updateSingleDealInRedis = exports.setDealsToRedis = void 0;
const redis_1 = __importDefault(require("../../../redis"));
const common_1 = require("../../interface/common");
const deals_model_1 = __importDefault(require("./deals.model"));
const DEAL_TTL = 10800;
const setDealsToRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deals = yield deals_model_1.default.find().populate([
            {
                path: "products.productId",
                select: "name slug thumbnail price",
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
        ]);
        if (deals) {
            yield redis_1.default.setex(common_1.RedisKeys.deals, DEAL_TTL, JSON.stringify(deals));
        }
    }
    catch (err) {
        console.log(err);
    }
});
exports.setDealsToRedis = setDealsToRedis;
const updateSingleDealInRedis = (id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let deal;
    const catchData = yield redis_1.default.get(common_1.RedisKeys.deals);
    if (catchData !== null) {
        deal = (_a = JSON.parse(catchData)) === null || _a === void 0 ? void 0 : _a.find((d) => d._id.toString() === id);
    }
    else {
        deal = yield deals_model_1.default.findById(id);
    }
    if (!deal) {
        return console.log("deal not found to update redis");
    }
});
exports.updateSingleDealInRedis = updateSingleDealInRedis;
