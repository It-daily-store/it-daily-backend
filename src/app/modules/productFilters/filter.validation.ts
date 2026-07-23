import { z } from "zod";

const createFilterValidationSchema = z.object({
  title: z
    .string({
      required_error: "Filter title is required",
      invalid_type_error: "Filter title should be string",
    })
    .min(1, "Filter title is required"),

  options: z
    .array(
      z.string({
        required_error: "At least one option is required",
        invalid_type_error: "Options should be an array of objects",
      })
    )
    .min(1, { message: "At least one option is required" }),
});

const updateFilterValidationSchema = z.object({
  title: z
    .string({
      invalid_type_error: "Filter title should be string",
    })
    .min(1, "Filter title is required")
    .optional(),

  options: z
    .array(
      z.object({
        optionId: z.union([z.string(), z.number()]).optional(),
        value: z.string(),
      })
    )
    .min(1, { message: "At least one option is required" })
    .optional(),
});

export const filterValidations = {
  createFilterValidationSchema,
  updateFilterValidationSchema,
};
