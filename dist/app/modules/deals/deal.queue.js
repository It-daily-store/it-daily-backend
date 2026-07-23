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
exports.dealQueue = exports.DealJobName = void 0;
const bullmq_1 = require("bullmq");
const common_1 = require("../../interface/common");
const deal_redis_1 = require("./deal.redis");
var DealJobName;
(function (DealJobName) {
    DealJobName["updateAllDeals"] = "updateAllDeals";
})(DealJobName || (exports.DealJobName = DealJobName = {}));
const redisConnection = {
    connection: {
        url: process.env.REDIS_URL,
    },
};
exports.dealQueue = new bullmq_1.Queue(common_1.RedisKeys.deals, redisConnection);
const dealWorker = new bullmq_1.Worker(common_1.RedisKeys.deals, (job) => __awaiter(void 0, void 0, void 0, function* () {
    if ((job.name = DealJobName.updateAllDeals)) {
        yield (0, deal_redis_1.setDealsToRedis)();
    }
}), redisConnection);
dealWorker.on("completed", (job) => {
    console.log(`Deal Job ${job.id} completed!`);
});
dealWorker.on("failed", (job, err) => {
    console.log(`Deal Job ${job === null || job === void 0 ? void 0 : job.id} failed: ${err.message}`);
});
