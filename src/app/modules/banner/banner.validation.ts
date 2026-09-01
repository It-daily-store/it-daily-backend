import { z } from "zod";

// The internal shape of a breakpoint's layout tree (panels, splits,
// elements) is owned by react-bannerkit, not this backend — see
// banner.interface.ts's TBannerBreakpoint for why it's intentionally NOT
// typed/validated field by field here. This schema only enforces the
// envelope: name/description are strings, breakpoints has exactly the 3
// known keys, and each one is an object. The tree's actual safety
// (nesting depth, URL schemes) is enforced by checkBreakpointsDepth
// (banner.utils.ts), which runs before this schema in the route chain
// and inspects the raw tree generically.
const looseTreeSchema = z.record(z.string(), z.unknown());

const breakpointsSchema = z
  .object({
    laptop: looseTreeSchema,
    tablet: looseTreeSchema,
    mobile: looseTreeSchema,
  })
  .strict();

const createTemplateValidationSchema = z
  .object({
    name: z.string().min(1, "Template name is required"),
    description: z.string().optional(),
    breakpoints: breakpointsSchema,
  })
  .strict();

// `is_active` is deliberately absent here. Activation is exclusive — it has
// to deactivate the outgoing template in the same operation — so it goes
// through setActiveValidationSchema and its own endpoint instead. Because
// this schema is .strict(), an is_active key smuggled into a builder Save
// is rejected rather than silently flipping the live banner.
const updateTemplateValidationSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    breakpoints: breakpointsSchema.optional(),
  })
  .strict();

const renameTemplateValidationSchema = z
  .object({
    name: z.string().min(1, "Template name is required"),
  })
  .strict();

const setActiveValidationSchema = z
  .object({
    is_active: z.boolean(),
  })
  .strict();

export const BannerTemplateValidationSchema = {
  createTemplateValidationSchema,
  updateTemplateValidationSchema,
  renameTemplateValidationSchema,
  setActiveValidationSchema,
};
