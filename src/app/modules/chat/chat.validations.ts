import { z } from "zod";

const createChatValidationSchema = z.object({
  title: z
    .string({ required_error: "Chat title is required" })
    .trim()
    .min(1, "Chat title is requred"),
  participants: z
    .array(
      z.string({
        required_error: "At least one participants is required",
        invalid_type_error: "Participants should be an array of objects",
      }),
      { required_error: "Participants is required" }
    )
    .min(1, { message: "At least one participants is required" }),
});

export const chatValidationSchema = { createChatValidationSchema };
