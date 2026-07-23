import { z } from "zod";

const createDealSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(5, "Description must be at least 5 characters"),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid start time",
    }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid end time",
    }),
    image: z.string().url("Invalid image URL"),
  })
  .refine((data) => new Date(data.startTime) > new Date(), {
    message: "Start time cannot be in the past",
    path: ["startTime"],
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time cannot be before start time",
    path: ["endTime"],
  });

export const DealValidationSchema = {
  createDealSchema,
};
