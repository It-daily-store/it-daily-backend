import { model, Schema } from "mongoose";
import { TNotification, TNotificationMeta } from "./notification.interface";

const notificationMetaSchema = new Schema<TNotificationMeta>(
  {
    entityName: { type: String },
    orderNumber: { type: String },
    orderStatus: { type: String },
  },
  { _id: false }
);

const notificationSchema = new Schema<TNotification>(
  {
    opened: {
      type: Boolean,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    userFrom: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    userTo: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    meta: {
      type: notificationMetaSchema,
    },
    notificationType: {
      type: String,
      enum: [
        "order",
        "address",
        "gallery",
        "role",
        "product",
        "productDetails",
        "category",
        "photo",
        "user",
        "brand",
        "bulkUpload",
        "productFilter",
      ],
    },
    actionType: {
      type: String,
      enum: ["create", "update", "delete"],
    },
  },
  { timestamps: true }
);

notificationSchema.index({ opened: 1 }, { expireAfterSeconds: 7776000 });
notificationSchema.index({ userFrom: 1 }, { expireAfterSeconds: 7776000 });
notificationSchema.index({ userTo: 1 }, { expireAfterSeconds: 7776000 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const Notification = model<TNotification>("notifications", notificationSchema);

export default Notification;
