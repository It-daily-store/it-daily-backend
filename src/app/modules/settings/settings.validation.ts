import { z } from "zod";

const PcPartSchema = z.object({
  id: z.number().min(1000).max(1100),
  name: z.string().min(1, "Name is required"),
  category: z.string(),
  isRequired: z.boolean(),
});

const PcCategorySchema = z.object({
  title: z.string().min(1, "Title is required"),
  parts: z.array(PcPartSchema),
});

const PcBuildSettingsSchema = z.object({
  coreComponents: PcCategorySchema,
  peripherals: PcCategorySchema,
});

const UpdateSettingsSchema = z.object({
  pcBuilder: PcBuildSettingsSchema,
});

export const SettingsValidationSchema = {
  UpdateSettingsSchema,
};
