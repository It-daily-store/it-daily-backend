import slugify from "slugify";
import { z } from "zod";

const SLUG_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;

export const SLUG_ERROR =
  "Slug can only contain letters, numbers and single hyphens";

export const isValidSlug = (slug: string) => SLUG_PATTERN.test(slug);

// Keeps product specs readable instead of letting strict mode drop them (15.6" -> 15-6-inch, FHD+ -> fhd-plus).
const expandSpecs = (text: string) =>
  text
    .replace(/(\d)\.(\d)/g, "$1-$2")
    .replace(/(\d)\s*(?:"|''|”|″)/g, "$1-inch ")
    .replace(/\+/g, " plus ");

export const toSlug = (text: string) =>
  slugify(expandSpecs(text), { lower: true, strict: true, trim: true });

export const slugSchema = z
  .string({ invalid_type_error: "Slug has to be a string" })
  .trim()
  .regex(SLUG_PATTERN, SLUG_ERROR);

type TSlugDoc = { _id: unknown; slug?: string; name?: string };

// Plans new slugs for documents whose slug breaks the rule; taken slugs are compared case-insensitively.
export const planSlugFixes = (docs: TSlugDoc[], takenSlugs: Set<string>) => {
  const taken = new Set([...takenSlugs].map((s) => s.toLowerCase()));
  docs
    .filter((doc) => isValidSlug(String(doc.slug ?? "")))
    .forEach((doc) => taken.add(String(doc.slug).toLowerCase()));

  return docs
    .filter((doc) => !isValidSlug(String(doc.slug ?? "")))
    .map((doc) => {
      const id = String(doc._id);
      const base =
        toSlug(String(doc.slug ?? "")) ||
        toSlug(String(doc.name ?? "")) ||
        `product-${id}`;

      let to = base;
      for (let n = 2; taken.has(to); n++) {
        to = `${base}-${n}`;
      }
      taken.add(to);

      return { id, from: String(doc.slug ?? ""), to };
    });
};
