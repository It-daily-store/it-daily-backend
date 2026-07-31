import { z } from "zod";

// Only allow absolute http(s) URLs or relative paths starting with "/".
// This blocks dangerous schemes (javascript:, data:, etc.) from being
// persisted into the Mixed `data` field and later served verbatim to
// every visitor of the public homepage.
const safeUrlSchema = (fieldLabel: string) =>
  z
    .string()
    .min(1, `${fieldLabel} is required`)
    .refine((v) => /^(https?:\/\/|\/)/.test(v), {
      message: `${fieldLabel} must be an absolute http(s) URL or a relative path starting with /`,
    });

const safeOptionalUrlSchema = (fieldLabel: string) =>
  z
    .string()
    .refine((v) => v === "" || /^(https?:\/\/|\/)/.test(v), {
      message: `${fieldLabel} must be an absolute http(s) URL or a relative path starting with /`,
    })
    .optional();

const imageSlotSchema = z
  .object({
    mobile: safeUrlSchema("Mobile image"),
    tablet: safeUrlSchema("Tablet image"),
    laptop: safeUrlSchema("Laptop image"),
  })
  .strict();

const carouselSlideSchema = z
  .object({
    images: imageSlotSchema,
    headline: z.string().optional(),
    subtext: z.string().optional(),
    ctaLabel: z.string().optional(),
    ctaLink: safeOptionalUrlSchema("CTA link"),
  })
  .strict();

const updateCarouselValidationSchema = z
  .object({
    slides: z.array(carouselSlideSchema).min(1, "At least one slide is required"),
  })
  .strict();

const splitGridTextTileSchema = z
  .object({
    images: imageSlotSchema,
    headline: z.string().optional(),
    subtext: z.string().optional(),
    ctaLabel: z.string().optional(),
    ctaLink: safeOptionalUrlSchema("CTA link"),
  })
  .strict();

const splitGridLinkTileSchema = z
  .object({
    images: imageSlotSchema,
    link: safeOptionalUrlSchema("Link"),
  })
  .strict();

const updateSplitGridValidationSchema = z
  .object({
    main: splitGridTextTileSchema,
    top: splitGridLinkTileSchema,
    bottom: splitGridLinkTileSchema,
  })
  .strict();

const updateSideBannerValidationSchema = z
  .object({
    images: imageSlotSchema,
    headline: z.string().optional(),
    subtext: z.string().optional(),
    ctaLabel: z.string().optional(),
    ctaLink: safeOptionalUrlSchema("CTA link"),
  })
  .strict();

export const BannerValidationSchema = {
  updateCarouselValidationSchema,
  updateSplitGridValidationSchema,
  updateSideBannerValidationSchema,
};
