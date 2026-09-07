import { z } from "zod";

const createAddressValidationSchema = z.object({
  address: z
    .string({ required_error: "Address is required" })
    .trim()
    .min(1, "Address is required"),
  city: z
    .string({ required_error: "City is required" })
    .trim()
    .min(1, "City is required"),
  district: z
    .string({ required_error: "District is required" })
    .trim()
    .min(1, "District is required"),
  label: z.enum(["home", "office", "other"]).optional(),
  isDefault: z.boolean().optional(),
});

const updateAddressValidationSchema = z.object({
  address: z.string().trim().min(1, "Address is required").optional(),
  city: z.string().trim().min(1, "City is required").optional(),
  district: z.string().trim().min(1, "District is required").optional(),
  label: z.enum(["home", "office", "other"]).optional(),
  isDefault: z.boolean().optional(),
});

export const AddressValidations = {
  createAddressValidationSchema,
  updateAddressValidationSchema,
};
