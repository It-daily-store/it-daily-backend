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
      "http://localhost:3000",
      "http://localhost:3001",
      "http://192.168.0.103:3000",
      "http://localhost:4000",
      "https://www.admin.gadgetgrid.live",
      "https://admin.gadgetgrid.live",
      "https://gadgetgrid.live",
      "https://www.gadgetgrid.live",
      "https://gadget-grid-admin-v2-fork.vercel.app",
      "https://gadget-grid-homepage-fork.vercel.app",
    ],
    credentials: true,
  })
);

app.use(
  "/payment/webhook",
  express.raw({ type: "application/json" }),
  paymentWebhook
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
