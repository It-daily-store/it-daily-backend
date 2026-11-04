import { Redis } from "ioredis";
console.log("Redis url: ", process.env.REDIS_URL);
const redisClient = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    // Fail fast instead of queueing commands while disconnected, so requests fall back to MongoDB.
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    commandTimeout: 5000,
  }
);

redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.on("connect", () => console.log("Redis connected"));

export const getCache = async (key: string): Promise<string | null> => {
  try {
    return await redisClient.get(key);
  } catch (err) {
    console.error(
      `Redis read failed for ${key}: ${err instanceof Error ? err.message : err}`
    );
    return null;
  }
};

export default redisClient;
