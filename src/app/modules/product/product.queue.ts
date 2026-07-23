import { ConnectionOptions, Queue, Worker } from "bullmq";
import { RedisKeys } from "../../interface/common";
import { setProductsToRedis, updateSigleProductToRedis } from "./product.redis";
import { Types } from "mongoose";

const redisConnection = {
  connection: {
    url: process.env.REDIS_URL, // ✅ use Railway's Redis URL
  },
};
export enum ProductJobName {
  updateAllProducts = "updateAllProducts",
  updateSingleProduct = "updateSingleProduct",
}

export const productQueue = new Queue(RedisKeys.products, redisConnection);

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
  redisConnection
);

productWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed!`);
});

productWorker.on("failed", (job, err) => {
  console.log(`Job ${job?.id} failed: ${err.message}`);
});
