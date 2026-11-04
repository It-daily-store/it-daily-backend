import { JobsOptions, Queue, QueueOptions, Worker, WorkerOptions } from "bullmq";

const connection = {
  url: process.env.REDIS_URL,
};

export const queueOptions: QueueOptions = {
  connection: { ...connection, enableOfflineQueue: false },
};

// Idle workers poll Redis; long intervals keep Upstash's per-command billing low.
export const workerOptions: WorkerOptions = {
  connection,
  drainDelay: 60,
  stalledInterval: 300000,
};

const ENQUEUE_TIMEOUT = 5000;

// BullMQ waits forever for an unreachable Redis, so cap how long a request can block on it.
export const addJob = (
  queue: Queue,
  name: string,
  data: unknown,
  opts?: JobsOptions,
) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out queuing ${queue.name}:${name}`)),
      ENQUEUE_TIMEOUT,
    );

    queue
      .add(name, data, opts)
      .then(() => resolve(), reject)
      .finally(() => clearTimeout(timer));
  });

export const enqueueInBackground = (
  queue: Queue,
  name: string,
  data: unknown = {},
  opts?: JobsOptions,
) => {
  addJob(queue, name, data, opts).catch((err) =>
    console.error(`Failed to queue ${queue.name}:${name}: ${err.message}`),
  );
};

export const logWorkerErrors = (worker: Worker) => {
  let lastMessage = "";

  worker.on("error", (err) => {
    if (err.message === lastMessage) {
      return;
    }
    lastMessage = err.message;
    console.error(`${worker.name} worker error: ${err.message}`);
  });

  worker.on("ready", () => {
    lastMessage = "";
  });
};
