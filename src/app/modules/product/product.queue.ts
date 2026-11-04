import { Queue, Worker } from "bullmq";
import { RedisKeys } from "../../interface/common";
import { setProductsToRedis, updateSigleProductToRedis } from "./product.redis";
import { Types } from "mongoose";
import {
  enqueueInBackground,
  logWorkerErrors,
  queueOptions,
  workerOptions,
} from "../../queues/queue.config";

export enum ProductJobName {
  updateAllProducts = "updateAllProducts",
  updateSingleProduct = "updateSingleProduct",
}

export const productQueue = new Queue(RedisKeys.products, queueOptions);

export const refreshProductsCache = () =>
  enqueueInBackground(productQueue, ProductJobName.updateAllProducts);

export const refreshSingleProductCache = (id: unknown) =>
  enqueueInBackground(productQueue, ProductJobName.updateSingleProduct, id);

const productWorker = new Worker(
  RedisKeys.products,
  async (job) => {
    // sync all products with redis
    if (job.name === ProductJobName.updateAllProducts) {
      await setProductsToRedis();
    }
    // sync single product update
    else if (job.name === ProductJobName.updateSingleProduct) {
      console.log("productid", job.data);
      await updateSigleProductToRedis(
        job.data as unknown as Types.ObjectId,
        "update"
      );
    }
  },
  workerOptions
);

logWorkerErrors(productWorker);

productWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed!`);
});

productWorker.on("failed", (job, err) => {
  console.log(`Job ${job?.id} failed: ${err.message}`);
});
