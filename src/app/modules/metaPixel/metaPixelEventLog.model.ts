import { model, Schema } from "mongoose";
import { IMetaPixelEventLog } from "./metaPixel.interface";

const metaPixelEventLogSchema = new Schema<IMetaPixelEventLog>(
  {
    eventName: { type: String, required: true, index: true },
    eventId: { type: String, required: true, index: true },
    source: {
      type: String,
      enum: ["browser_backup", "status_rule", "manual", "test_connection"],
      required: true,
    },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", index: true },
    triggerKey: { type: String },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["queued", "sent", "failed", "dead"],
      default: "queued",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    httpStatus: { type: Number },
    metaResponse: { type: Schema.Types.Mixed },
    fbtraceId: { type: String },
    errorMessage: { type: String },
  },
  { timestamps: true },
);

// Logs are diagnostic, not a record of truth — the per-order ledger is.
metaPixelEventLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
);

const MetaPixelEventLog = model<IMetaPixelEventLog>(
  "MetaPixelEventLog",
  metaPixelEventLogSchema,
);

export default MetaPixelEventLog;
