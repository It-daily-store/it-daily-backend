import slugify from "slugify";
import { z } from "zod";

const SLUG_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;

export const SLUG_ERROR =
  "Slug can only contain letters, numbers and single hyphens";

export const isValidSlug = (slug: string) => SLUG_PATTERN.test(slug);

export const toSlug = (text: string) =>
  slugify(text, { lower: true, strict: true, trim: true });

export const slugSchema = z
  .string({ invalid_type_error: "Slug has to be a string" })
  .trim()
  .regex(SLUG_PATTERN, SLUG_ERROR);
