import { model, Schema } from "mongoose";
import { IMetaPixelConfig } from "./metaPixel.interface";
import { ORDER_STATUSES } from "./metaPixel.constants";

const triggerSchema = new Schema(
  {
    key: { type: String, required: true },
    eventName: { type: String, default: "" },
    isCustomEvent: { type: Boolean, default: false },
    enabled: { type: Boolean, default: false },
    sendViaBrowser: { type: Boolean, default: true },
    sendViaCapi: { type: Boolean, default: false },
  },
  { _id: false },
);

const statusRuleSchema = new Schema({
  status: { type: String, enum: ORDER_STATUSES, required: true },
  eventName: { type: String, required: true },
  isCustomEvent: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
});

const metaPixelConfigSchema = new Schema<IMetaPixelConfig>(
  {
    pixelId: { type: String, trim: true },
    datasetId: { type: String, trim: true },
    accessToken: { type: String },
    testEventCode: { type: String, trim: true },
    tokenVerifiedAt: { type: Date },
    tokenExpiresAt: { type: Date },
    enabled: { type: Boolean, default: false },
    capiEnabled: { type: Boolean, default: false },
    currency: { type: String, default: "BDT" },
    contentIdSource: {
      type: String,
      enum: ["sku", "_id", "slug"],
      default: "sku",
    },
    contentType: { type: String, default: "product" },
    excludedIps: { type: [String], default: [] },
    blockBots: { type: Boolean, default: true },
    triggers: { type: [triggerSchema], default: [] },
    statusRules: { type: [statusRuleSchema], default: [] },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

const MetaPixelConfig = model<IMetaPixelConfig>(
  "MetaPixelConfig",
  metaPixelConfigSchema,
);

export default MetaPixelConfig;
