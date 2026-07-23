import z from "zod";

const addressSchema = z.object({
  address: z.string().min(1, "Address is required").trim(),
  city: z.string().min(1, "City is required").trim(),
  district: z.string().min(1, "District is required").trim(),
});

const productSchema = z.object({
  id: z.string().min(1, "District is required").trim(),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

const createOrderValidationSchema = z.object({
  products: z
    .array(productSchema)
    .min(1, "At least one product is required")
    .refine((products) => {
      // Check for duplicate product IDs
      const ids = products.map((p) => p.id.toString());
      return new Set(ids).size === ids.length;
    }, "Duplicate products are not allowed"),
  billingAddress: addressSchema,
  shippingAddress: addressSchema,
  paymentMethod: z.enum(["card", "paypal", "bank_transfer", "cod"], {
    errorMap: () => ({ message: "Invalid payment method" }),
  }),
  shippingMethod: z.enum(["standard", "express", "overnight"], {
    errorMap: () => ({ message: "Invalid shipping method" }),
  }),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
  saveAddress: z.boolean().optional(),
});

const OrderStatusEnum = z.enum([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
]);

const PaymentStatusEnum = z.enum(["pending", "paid", "failed", "refunded"]);
const PaymentMethodEnum = z.enum(["card", "paypal", "bank_transfer", "cod"]);
const ShippingMethodEnum = z.enum(["standard", "express", "overnight"]);

const AdminUpdateOrderSchema = z
  .object({
    currentStatus: OrderStatusEnum.optional(),
    paymentStatus: PaymentStatusEnum.optional(),
    paymentMethod: PaymentMethodEnum.optional(),
    shippingMethod: ShippingMethodEnum.optional(),
    trackingNumber: z
      .string()
      .regex(/^[A-Z0-9-]{5,50}$/i, "Invalid tracking number format")
      .optional()
      .or(z.literal("").transform(() => undefined)),

    adminNotes: z
      .string()
      .max(500, "Notes too long (max 500 chars)")
      .optional()
      .or(z.literal("").transform(() => undefined)),

    // Addresses — at least one field must change or be provided
    shippingAddress: addressSchema.optional(),

    billingAddress: addressSchema.optional().nullable(), // can be null = same as shipping

    // Optional: allow partial updates
  })
  .refine(
    (data) => {
      // At least one field must be provided for update
      const hasUpdate = Object.values(data).some(
        (value) =>
          value !== undefined &&
          value !== null &&
          (typeof value !== "object" || Object.keys(value).length > 0)
      );
      return hasUpdate;
    },
    {
      message: "At least one field must be provided to update the order",
    }
  );

// TypeScript type from schema
export type TAdminUpdateOrderPayload = z.infer<typeof AdminUpdateOrderSchema>;

const orderValidations = {
  createOrderValidationSchema,
  AdminUpdateOrderSchema,
};

export default orderValidations;
