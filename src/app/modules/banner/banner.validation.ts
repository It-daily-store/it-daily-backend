import { z } from "zod";

const imageSlotSchema = z.object({
  mobile: z.string({ required_error: "Mobile image is required" }).min(1, "Mobile image is required"),
  tablet: z.string({ required_error: "Tablet image is required" }).min(1, "Tablet image is required"),
  laptop: z.string({ required_error: "Laptop image is required" }).min(1, "Laptop image is required"),
});

const carouselSlideSchema = z.object({
  images: imageSlotSchema,
  headline: z.string().optional(),
  subtext: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaLink: z.string().optional(),
});

const updateCarouselValidationSchema = z.object({
  slides: z.array(carouselSlideSchema).min(1, "At least one slide is required"),
});

const splitGridTextTileSchema = z.object({
  images: imageSlotSchema,
  headline: z.string().optional(),
  subtext: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaLink: z.string().optional(),
});

const splitGridLinkTileSchema = z.object({
  images: imageSlotSchema,
  link: z.string().optional(),
});

const updateSplitGridValidationSchema = z.object({
  main: splitGridTextTileSchema,
  top: splitGridLinkTileSchema,
  bottom: splitGridLinkTileSchema,
});

const updateSideBannerValidationSchema = z.object({
  images: imageSlotSchema,
  headline: z.string().optional(),
  subtext: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaLink: z.string().optional(),
});

export const BannerValidationSchema = {
  updateCarouselValidationSchema,
  updateSplitGridValidationSchema,
  updateSideBannerValidationSchema,
};
