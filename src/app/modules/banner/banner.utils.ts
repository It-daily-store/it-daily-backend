import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { MAX_TREE_DEPTH } from "./banner.constant";

// Blocks scripting/URL schemes that execute or embed arbitrary content
// when rendered back out on the public, unauthenticated `/get/:id`
// response. Applied to every string value anywhere in the tree (not just
// specific named fields like `href`/`src`/`img`) because the tree's shape
// is intentionally opaque to this backend — react-bannerkit owns which
// fields hold URLs, and that set can change release to release. Scanning
// every string is the shape-agnostic equivalent of the old field-by-field
// safeUrlSchema.
//
// Tab/newline/CR characters are stripped before testing: browsers strip
// those characters from anywhere in a URL before parsing its scheme (per
// the WHATWG URL spec), so "java\tscript:alert(1)" still executes as
// javascript: at render time even though the literal string doesn't match
// a naive scheme regex. Matching that stripping here closes the bypass.
//
// `data:` is not blocked outright: react-bannerkit itself seeds every new
// panel/slide/image element with a `data:image/gif;base64,...` placeholder
// (createDefaultTemplate / normalizeTemplate), so an outright ban made every
// template the package produces fail validation. Only active-content data
// URIs are dangerous here (`data:text/html`, `data:image/svg+xml` — SVG can
// embed `<script>`); a handful of raster image MIME types are allowed.
const DANGEROUS_SCRIPT_SCHEME = /^\s*(javascript|vbscript):/i;
const DATA_SCHEME = /^\s*data:/i;
const SAFE_DATA_IMAGE = /^\s*data:image\/(png|jpe?g|gif|webp|avif);base64,/i;
const stripUrlWhitespace = (value: string) => value.replace(/[\t\n\r]/g, "");
const isDangerousUrl = (value: string): boolean => {
  const stripped = stripUrlWhitespace(value);
  if (DANGEROUS_SCRIPT_SCHEME.test(stripped)) return true;
  if (DATA_SCHEME.test(stripped) && !SAFE_DATA_IMAGE.test(stripped)) return true;
  return false;
};

/**
 * Deliberately iterative (explicit stack), not recursive, and
 * deliberately shape-agnostic (walks whatever object/array nesting
 * exists — no assumption about `kind`/`a`/`b`/`elements`/any specific
 * field name) — because the layout tree's actual shape belongs to
 * react-bannerkit and this backend must keep working across that
 * package's future versions without a code change. Enforces the two
 * things that matter regardless of shape: a bounded nesting depth
 * (adversarial-payload / stack-safety guard) and no dangerous URL scheme
 * in any string.
 */
export const assertTreeSafe = (root: unknown): void => {
  const stack: { node: unknown; depth: number }[] = [{ node: root, depth: 1 }];

  while (stack.length) {
    const { node, depth } = stack.pop()!;

    if (depth > MAX_TREE_DEPTH) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Layout tree exceeds max depth of ${MAX_TREE_DEPTH}`
      );
    }

    if (typeof node === "string") {
      if (isDangerousUrl(node)) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Unsafe URL scheme is not allowed in template content: "${node}"`
        );
      }
      continue;
    }

    if (Array.isArray(node)) {
      for (const child of node) stack.push({ node: child, depth: depth + 1 });
      continue;
    }

    if (node && typeof node === "object") {
      for (const value of Object.values(node)) {
        stack.push({ node: value, depth: depth + 1 });
      }
    }
  }
};

// Named alias kept for continuity with the export name routes/tests used
// before this task's rewrite — same function.
export const assertTreeDepth = assertTreeSafe;

/**
 * Express middleware wrapping `assertTreeSafe`. Wired into the `/create`
 * and `/update/:id` route chains BEFORE `validateRequest` (the Zod parse).
 */
export const checkBreakpointsDepth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const breakpoints = req.body?.breakpoints as
      | Record<string, unknown>
      | undefined;
    if (breakpoints) {
      for (const tree of Object.values(breakpoints)) {
        if (tree) assertTreeSafe(tree);
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};
