import { Queue, Worker } from "bullmq";
import { RedisKeys } from "../../interface/common";
import { setDealsToRedis } from "./deal.redis";
import {
  enqueueInBackground,
  logWorkerErrors,
  queueOptions,
  workerOptions,
} from "../../queues/queue.config";

export enum DealJobName {
  updateAllDeals = "updateAllDeals",
}

export const dealQueue = new Queue(RedisKeys.deals, queueOptions);

export const refreshDealsCache = () =>
  enqueueInBackground(dealQueue, DealJobName.updateAllDeals);

const dealWorker = new Worker(
  RedisKeys.deals,
  async (job) => {
    if (job.name === DealJobName.updateAllDeals) {
      await setDealsToRedis();
    }
  },
  workerOptions,
);

logWorkerErrors(dealWorker);

dealWorker.on("completed", (job) => {
  console.log(`Deal Job ${job.id} completed!`);
});

dealWorker.on("failed", (job, err) => {
  console.log(`Deal Job ${job?.id} failed: ${err.message}`);
});
