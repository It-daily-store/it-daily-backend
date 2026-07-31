import { z } from "zod";

// Only allow absolute http(s) URLs or relative paths starting with "/".
// Blocks dangerous schemes (javascript:, data:, etc.) from being
// persisted into the Mixed `breakpoints` field and later served verbatim
// to every unauthenticated visitor of the public `/get/:id` endpoint.
const safeUrlSchema = (label: string) =>
  z.string().refine((v) => v === "" || /^(https?:\/\/|\/)/.test(v), {
    message: `${label} must be an absolute http(s) URL or a relative path starting with /`,
  });

const percentSchema = z.number().min(0).max(100);

const overlayBaseSchema = z.object({
  id: z.string().min(1),
  xPercent: percentSchema,
  yPercent: percentSchema,
  widthPercent: percentSchema.optional(),
  rotationDeg: z.number().optional(),
  zIndex: z.number().int().optional(),
});

const textOverlaySchema = overlayBaseSchema
  .extend({
    type: z.literal("text"),
    text: z.string().min(1, "Overlay text is required"),
    fontSizePx: z.number().positive().optional(),
    color: z.string().optional(),
    fontWeight: z.enum(["normal", "bold"]).optional(),
    align: z.enum(["left", "center", "right"]).optional(),
  })
  .strict();

const buttonOverlaySchema = overlayBaseSchema
  .extend({
    type: z.literal("button"),
    label: z.string().min(1, "Button label is required"),
    href: safeUrlSchema("Button link"),
    bgColor: z.string().optional(),
    textColor: z.string().optional(),
  })
  .strict();

const overlaySchema = z.discriminatedUnion("type", [
  textOverlaySchema,
  buttonOverlaySchema,
]);

// Note: id/type are inlined directly into each `kind`-discriminated leaf
// variant (rather than expressed as z.object({id, type}).and(discriminatedUnion(...)))
// because intersecting a plain object schema with a `.strict()` discriminated
// union causes Zod to validate BOTH schemas against the full input — the
// strict union member then rejects `id`/`type` as "unrecognized keys" and
// every leaf fails validation. Inlining avoids that intersection pitfall
// while keeping the exact same field names/shape on the wire.
const imageLeafDataSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("leaf"),
    kind: z.literal("image"),
    src: safeUrlSchema("Image source").refine((v) => v.length >= 1, {
      message: "Image is required",
    }),
    alt: z.string().optional(),
    link: safeUrlSchema("Link").optional(),
    overlays: z.array(overlaySchema).default([]),
  })
  .strict();

const carouselSlideSchema = z
  .object({
    id: z.string().min(1),
    src: safeUrlSchema("Slide image").refine((v) => v.length >= 1, {
      message: "Slide image is required",
    }),
    alt: z.string().optional(),
    link: safeUrlSchema("Link").optional(),
    overlays: z.array(overlaySchema).default([]),
  })
  .strict();

const carouselLeafDataSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("leaf"),
    kind: z.literal("carousel"),
    slides: z.array(carouselSlideSchema).min(1, "At least one slide is required"),
    autoplayMs: z.number().int().positive().optional(),
    loop: z.boolean().optional(),
  })
  .strict();

const leafNodeSchema = z.discriminatedUnion("kind", [
  imageLeafDataSchema,
  carouselLeafDataSchema,
]);

type TPanelNodeInput =
  | z.infer<typeof leafNodeSchema>
  | {
      id: string;
      type: "split";
      direction: "horizontal" | "vertical";
      sizes: number[];
      children: TPanelNodeInput[];
    };

const panelNodeSchema: z.ZodType<TPanelNodeInput, z.ZodTypeDef, unknown> = z.lazy(() =>
  z.union([
    leafNodeSchema,
    z
      .object({
        id: z.string().min(1),
        type: z.literal("split"),
        direction: z.enum(["horizontal", "vertical"]),
        sizes: z.array(z.number().positive()).min(2, "A split needs at least 2 panels"),
        children: z.array(panelNodeSchema).min(2),
      })
      .strict()
      .refine((n) => n.sizes.length === n.children.length, {
        message: "sizes and children must be the same length",
      }),
  ])
);

const breakpointsSchema = z.object({
  laptop: panelNodeSchema,
  tablet: panelNodeSchema,
  mobile: panelNodeSchema,
});

const createTemplateValidationSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  breakpoints: breakpointsSchema,
});

const updateTemplateValidationSchema = z.object({
  name: z.string().min(1).optional(),
  breakpoints: breakpointsSchema.optional(),
});

const renameTemplateValidationSchema = z.object({
  name: z.string().min(1, "Template name is required"),
});

export const BannerTemplateValidationSchema = {
  createTemplateValidationSchema,
  updateTemplateValidationSchema,
  renameTemplateValidationSchema,
};
