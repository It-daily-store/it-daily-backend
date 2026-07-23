"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const mongoose_1 = require("mongoose");
const ChatSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, "Chat title is required"],
    },
    participants: [
        {
            type: String,
            required: [true, "Participants is required"],
        },
    ],
    createdBy: {
        type: String,
        required: [true, "Creator information is required"],
    },
}, {
    timestamps: true,
});
exports.Chat = (0, mongoose_1.model)("Chat", ChatSchema);
