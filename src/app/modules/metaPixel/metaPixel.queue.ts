import { Queue, UnrecoverableError, Worker } from "bullmq";
import { Types } from "mongoose";
import { RedisKeys } from "../../interface/common";
import Order from "../order/order.model";
import MetaPixelEventLog from "./metaPixelEventLog.model";
import { MetaPixelService } from "./metaPixel.service";
import { sendToMeta } from "./metaPixel.sender";
import { TSentEventStatus } from "./metaPixel.interface";

const redisConnection = {
  connection: {
    url: process.env.REDIS_URL,
  },
};

export type TMetaEventJob = {
  logId: string;
  orderId?: string;
  eventName: string;
  eventId: string;
};

export const metaPixelQueue = new Queue(
  RedisKeys.metaPixelEvents,
  redisConnection,
);

const updateLedger = async (
  orderId: string | undefined,
  eventName: string,
  patch: Partial<{
    status: TSentEventStatus;
    attempts: number;
    sentAt: Date;
    fbtraceId: string;
    errorMessage: string;
  }>,
) => {
  if (!orderId) {
    return;
  }

  const set = Object.entries(patch).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [`trackingData.sentEvents.$[entry].${key}`]: value,
    }),
    {},
  );

  await Order.updateOne(
    { _id: new Types.ObjectId(orderId) },
    { $set: set },
    { arrayFilters: [{ "entry.eventName": eventName }] },
  );
};

export const enqueueMetaEvent = async (job: TMetaEventJob) => {
  try {
    await metaPixelQueue.add(RedisKeys.metaPixelEvents, job, {
      attempts: 5,
      backoff: { type: "exponential", delay: 60000 },
      removeOnComplete: 1000,
      removeOnFail: 1000,
    });
  } catch (err) {
    // Redis being unreachable must never bubble into an admin's status update.
    await MetaPixelEventLog.findByIdAndUpdate(job.logId, {
      status: "dead",
      errorMessage: `Failed to enqueue: ${
        err instanceof Error ? err.message : "unknown"
      }`,
    });
    await updateLedger(job.orderId, job.eventName, {
      status: "dead",
      errorMessage: "Failed to enqueue",
    });
  }
};

const metaPixelWorker = new Worker(
  RedisKeys.metaPixelEvents,
  async (job) => {
    const { logId, orderId, eventName } = job.data as TMetaEventJob;

    const log = await MetaPixelEventLog.findById(logId);

    if (!log) {
      throw new UnrecoverableError(`Event log ${logId} no longer exists`);
    }

    const config = await MetaPixelService.getConfig();

    if (!config.pixelId || !config.accessToken) {
      throw new UnrecoverableError("Meta pixel credentials are not configured");
    }

    const attempts = (job.attemptsMade ?? 0) + 1;

    const result = await sendToMeta({
      pixelId: config.pixelId,
      accessToken: config.accessToken,
      payload: log.payload as never,
    });

    await MetaPixelEventLog.findByIdAndUpdate(logId, {
      status: result.ok ? "sent" : result.retryable ? "failed" : "dead",
      attempts,
      httpStatus: result.httpStatus,
      metaResponse: result.body,
      fbtraceId: result.fbtraceId,
      errorMessage: result.errorMessage,
    });

    await updateLedger(orderId, eventName, {
      status: result.ok ? "sent" : result.retryable ? "failed" : "dead",
      attempts,
      ...(result.ok ? { sentAt: new Date() } : {}),
      ...(result.fbtraceId ? { fbtraceId: result.fbtraceId } : {}),
      ...(result.errorMessage ? { errorMessage: result.errorMessage } : {}),
    });

    if (!result.ok) {
      if (!result.retryable) {
        throw new UnrecoverableError(
          result.errorMessage ?? "Meta rejected the event",
        );
      }

      throw new Error(result.errorMessage ?? "Meta send failed");
    }
  },
  redisConnection,
);

metaPixelWorker.on("failed", async (job, err) => {
  if (!job) {
    return;
  }

  const isFinalAttempt =
    err instanceof UnrecoverableError ||
    (job.attemptsMade ?? 0) >= (job.opts.attempts ?? 1);

  if (!isFinalAttempt) {
    return;
  }

  const { logId, orderId, eventName } = job.data as TMetaEventJob;

  await MetaPixelEventLog.findByIdAndUpdate(logId, {
    status: "dead",
    errorMessage: err.message,
  });
  await updateLedger(orderId, eventName, {
    status: "dead",
    errorMessage: err.message,
  });
});
