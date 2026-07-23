import express, { Application } from "express";
import cors from "cors";
import router from "./app/routes";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import notFound from "./app/middleware/notFound";
import cookieParser from "cookie-parser";
import { paymentWebhook } from "./app/modules/order/order.service";
import redisClient from "./redis";

const app: Application = express();

app.use(
  cors({
    origin: [
      "http://localhost:6001",
      "http://192.168.0.103:6001",
      "http://localhost:7000",
      "https://www.admin.itdaily.store",
      "https://admin.itdaily.store",
      "https://itdaily.store",
      "https://www.itdaily.store",
    ],
    credentials: true,
  }),
);

app.use(
  "/payment/webhook",
  express.raw({ type: "application/json" }),
  paymentWebhook,
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1", router);

app.get("/ping", async (req, res) => {
  const pong = await redisClient.ping();
  res.json({
    message:
      "Hello Docker! update from docker image. test after deleting files",
    redis: pong,
  });
});

app.use(globalErrorHandler);

app.use(notFound);

export default app;
