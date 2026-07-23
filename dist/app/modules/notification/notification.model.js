"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    opened: {
        type: Boolean,
        required: true,
    },
    source: {
        type: String,
        required: true,
    },
    userFrom: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    userTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    text: {
        type: String,
        required: true,
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
}, { timestamps: true });
notificationSchema.index({ opened: 1 }, { expireAfterSeconds: 7776000 });
notificationSchema.index({ userFrom: 1 }, { expireAfterSeconds: 7776000 });
notificationSchema.index({ userTo: 1 }, { expireAfterSeconds: 7776000 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
const Notification = (0, mongoose_1.model)("notifications", notificationSchema);
exports.default = Notification;
