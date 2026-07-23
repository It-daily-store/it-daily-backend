"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = require("ioredis");
console.log("Redis url: ", process.env.REDIS_URL);
const redisClient = new ioredis_1.Redis(process.env.REDIS_URL || "redis://localhost:6379");
redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.on("connect", () => console.log("Redis connected"));
exports.default = redisClient;
