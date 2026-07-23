import { model, Schema } from "mongoose";

const ChatSchema = new Schema<TChat>(
  {
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
  },
  {
    timestamps: true,
  }
);

export const Chat = model<TChat>("Chat", ChatSchema);
