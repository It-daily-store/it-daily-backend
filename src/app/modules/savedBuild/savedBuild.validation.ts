import { z } from "zod";

const buildPartSchema = z.object({
  partId: z.number({ required_error: "Part id is required" }),
  name: z.string({ required_error: "Part name is required" }),
  category: z.string().optional(),
  isRequired: z.boolean().optional(),
  product: z.string({ required_error: "Product is required" }),
});

const createSavedBuildValidationSchema = z.object({
  name: z
    .string({ required_error: "Build name is required" })
    .trim()
    .min(1, "Build name is required")
    .max(60, "Build name cannot be longer than 60 characters"),
  parts: z
    .array(buildPartSchema, { required_error: "Build parts are required" })
    .min(1, "Add at least one component before saving a build"),
});

const updateSavedBuildValidationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Build name is required")
    .max(60, "Build name cannot be longer than 60 characters")
    .optional(),
  parts: z
    .array(buildPartSchema)
    .min(1, "Add at least one component before saving a build")
    .optional(),
});

export const SavedBuildValidations = {
  createSavedBuildValidationSchema,
  updateSavedBuildValidationSchema,
};
