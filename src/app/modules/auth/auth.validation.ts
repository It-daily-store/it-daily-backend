import { z } from "zod";

const refreshTokenValidationSchema = z.object({
  refreshToken: z.string({ required_error: "Refresh token is required" }),
});

const forgotPassValidationSchema = z.object({
  email: z.string({ required_error: "Email is required" }),
});

const resetPassValidationSchema = z.object({
  email: z.string({ required_error: "Email is required" }),
  password: z
    .string({
      required_error: "Password is required",
      invalid_type_error: "Password must be a string",
    })
    .min(6, "Password must be at least 6 characters")
    .regex(
      new RegExp(".*[A-Z].*"),
      "Password should contain at least one uppercase character"
    ),
});

const updatePassValidationSchema = z.object({
  newPassword: z
    .string({
      required_error: "Password is required",
      invalid_type_error: "Password must be a string",
    })
    .min(6, "Password must be at least 6 characters")
    .regex(
      new RegExp(".*[A-Z].*"),
      "Password should contain at least one uppercase character"
    ),
  currentPassword: z.string({ required_error: "Current password in required" }),
});

const createCustomerValidationSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/[1-9]\d{1,14}$/, "Invalid phone number format"),
  name: z.object({
    firstName: z.string().min(1, "First name is required"),
    middleName: z.string().optional(),
    lastName: z.string().min(1, "Last name is required"),
  }),
});

export type RegisterFormValues = z.infer<typeof createCustomerValidationSchema>;

export const authValidations = {
  refreshTokenValidationSchema,
  forgotPassValidationSchema,
  resetPassValidationSchema,
  updatePassValidationSchema,
  createCustomerValidationSchema,
};
