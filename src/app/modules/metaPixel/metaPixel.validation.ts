import { z } from "zod";
import {
  META_STANDARD_EVENTS,
  ORDER_STATUSES,
  TRIGGER_KEYS,
} from "./metaPixel.constants";

// A custom event name must be a valid Meta event name: letters, digits,
// underscores and spaces only, so a typo cannot produce an unsendable event.
const eventNameSchema = z
  .string()
  .trim()
  .max(50)
  .regex(
    /^[A-Za-z0-9_ ]*$/,
    "Event name may only contain letters, digits, underscores and spaces",
  );

const triggerSchema = z
  .object({
    key: z.enum(TRIGGER_KEYS as [string, ...string[]]),
    eventName: eventNameSchema,
    isCustomEvent: z.boolean(),
    enabled: z.boolean(),
    sendViaBrowser: z.boolean(),
    sendViaCapi: z.boolean(),
  })
  .refine((t) => !t.enabled || t.eventName.length > 0, {
    message: "An enabled trigger must have an event name",
    path: ["eventName"],
  })
  .refine(
    (t) =>
      t.isCustomEvent ||
      !t.eventName ||
      META_STANDARD_EVENTS.includes(t.eventName as never),
    {
      message:
        "Unknown standard event. Mark it as a custom event to use this name.",
      path: ["eventName"],
    },
  );

const statusRuleSchema = z.object({
  _id: z.string().optional(),
  status: z.enum(ORDER_STATUSES as unknown as [string, ...string[]]),
  eventName: eventNameSchema.min(1, "Event name is required"),
  isCustomEvent: z.boolean(),
  enabled: z.boolean(),
});

const ipPatternSchema = z
  .string()
  .trim()
  .regex(
    /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/,
    "Use an IPv4 address or CIDR range, for example 203.0.113.7 or 203.0.113.0/24",
  );

const UpdateConfigSchema = z.object({
  pixelId: z.string().trim().max(50).optional(),
  datasetId: z.string().trim().max(50).optional(),
  // Absent means "keep the stored token"; an empty string means "clear it".
  accessToken: z.string().trim().optional(),
  testEventCode: z.string().trim().max(50).optional(),
  enabled: z.boolean().optional(),
  capiEnabled: z.boolean().optional(),
  currency: z.string().trim().length(3).optional(),
  contentIdSource: z.enum(["sku", "_id", "slug"]).optional(),
  excludedIps: z.array(ipPatternSchema).max(50).optional(),
  blockBots: z.boolean().optional(),
  triggers: z.array(triggerSchema).optional(),
  statusRules: z.array(statusRuleSchema).optional(),
});

export const MetaPixelValidation = { UpdateConfigSchema };
