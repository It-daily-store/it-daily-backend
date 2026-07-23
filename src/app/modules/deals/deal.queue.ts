import { ConnectionOptions, Queue, Worker } from "bullmq";
import { RedisKeys } from "../../interface/common";
import { setDealsToRedis } from "./deal.redis";

export enum DealJobName {
  updateAllDeals = "updateAllDeals",
}

const redisConnection = {
  connection: {
    url: process.env.REDIS_URL,
  },
};

export const dealQueue = new Queue(RedisKeys.deals, redisConnection);

const dealWorker = new Worker(
  RedisKeys.deals,
  async (job) => {
    if ((job.name = DealJobName.updateAllDeals)) {
      await setDealsToRedis();
    }
  },
  redisConnection
);

dealWorker.on("completed", (job) => {
  console.log(`Deal Job ${job.id} completed!`);
});

dealWorker.on("failed", (job, err) => {
  console.log(`Deal Job ${job?.id} failed: ${err.message}`);
});
