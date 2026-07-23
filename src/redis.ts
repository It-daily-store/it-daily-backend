import { Redis } from "ioredis";
console.log("Redis url: ", process.env.REDIS_URL);
const redisClient = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.on("connect", () => console.log("Redis connected"));

export default redisClient;
