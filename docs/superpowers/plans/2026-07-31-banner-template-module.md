# Banner Template Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old single-document `gridSlider` banner stub with a generic banner-template CRUD API: unlimited named templates, each holding a recursive nested layout tree per breakpoint (laptop/tablet/mobile), consumed by the new `@it-daily-store/banner` package's Builder (admin) and Renderer (public).

**Architecture:** A new `banner` module following the `brand` module's conventions exactly (`catchAsync`/`sendResponse`/`AppError`, `validateRequest`+Zod, `checkPermission`+`validateAuth`). The recursive layout tree is stored as `Schema.Types.Mixed` (Mongoose has no clean way to express an unbounded-depth self-referencing leaf-or-split union) and validated by a recursive Zod schema (`z.lazy()`) at the route layer, with an iterative pre-check guarding against pathologically deep payloads before Zod's own recursive descent runs.

**Tech Stack:** Express, Mongoose, Zod, existing `checkPermission`/`validateAuth` middleware, existing `Images` upload module (unchanged, reused as-is).

## Global Constraints

- Full context: `C:\Users\Mahmud\.claude\plans\lets-revamp-everything-i-piped-swan.md` (org-wide architecture plan).
- Field names are the wire contract with the `@it-daily-store/banner` package — must match byte-for-byte: `xPercent`/`yPercent` (not `x`/`y`), `src`, `href` (button), `link` (image/slide click-through), `sizes`/`children`/`direction` (split node).
- Carousel overlays are **per-slide** — no overlay array at the carousel-leaf level.
- No "active" flag — every non-deleted template is fetchable by its own ID at all times.
- **Delete the 4 legacy files currently on `main`** (`src/app/modules/banner/{banner.controller,banner.model,banner.routes,banner.service}.ts` — the old single `gridSlider`-doc stub with one `GET /get-banner` route, no CRUD). Do not attempt to preserve or migrate its one legacy document — see the model task for the collection-naming approach that sidesteps this entirely.
- `GET /banner/get/:id` must be reachable with **no auth token** (consumed by the public Renderer). Every other route requires `validateAuth()` + `checkPermission(EAppFeatures.banner, ...)`.
- No automated test framework in this repo (`npm test` is a stub) — verify manually via `npx tsc --noEmit` and `curl`/PowerShell `Invoke-RestMethod`, consistent with every other module in this codebase. Do not introduce a test framework as part of this plan.
- Reuse the existing `Images` module (`src/app/modules/Images/`, Cloudinary-backed) as-is for all image uploads (single images and carousel slides) — no changes to it.

---

## File Structure

- Delete: `src/app/modules/banner/banner.controller.ts`, `banner.model.ts`, `banner.routes.ts`, `banner.service.ts` (legacy 4-file stub).
- Modify: `src/app/modules/roles/roles.interface.ts` (add `EAppFeatures.banner`), `src/app/routes/index.ts` (register + auth-exempt the new module).
- Create: `src/app/modules/banner/{banner.interface.ts, banner.constant.ts, banner.model.ts, banner.utils.ts, banner.validation.ts, banner.service.ts, banner.controller.ts, banner.routes.ts}`.

---

## Task 1: Data layer (types, model, RBAC)

**Files:**
- Delete: `src/app/modules/banner/banner.controller.ts`, `banner.model.ts`, `banner.routes.ts`, `banner.service.ts`
- Modify: `src/app/modules/roles/roles.interface.ts`
- Create: `src/app/modules/banner/banner.interface.ts`, `src/app/modules/banner/banner.constant.ts`, `src/app/modules/banner/banner.model.ts`

**Interfaces:**
- Produces: `TOverlay`, `TImageLeafData`, `TCarouselLeafData`, `TLeafNode`, `TSplitNode`, `TPanelNode`, `TBreakpoints`, `TBannerTemplate` (types), `MAX_TREE_DEPTH` constant, `BannerTemplate` Mongoose model with static `findActiveById` — Task 2 (validation/service/controller/routes) consumes all of these by exact name.

- [ ] **Step 1: Remove the legacy 4-file stub**

```bash
git rm src/app/modules/banner/banner.controller.ts \
       src/app/modules/banner/banner.model.ts \
       src/app/modules/banner/banner.routes.ts \
       src/app/modules/banner/banner.service.ts
```

- [ ] **Step 2: Add `banner` to `EAppFeatures`**

Modify `src/app/modules/roles/roles.interface.ts`:

```ts
export enum EAppFeatures {
  gallery = "gallery",
  role = "role",
  product = "product",
  productDetails = "productDetails",
  category = "category",
  photo = "photo",
  user = "user",
  brand = "brand",
  bulkUpload = "bulkUpload",
  productFilter = "productFilter",
  deals = "deals",
  settings = "settings",
  orders = "orders",
  banner = "banner",
}
```

- [ ] **Step 3: Write `banner.interface.ts`**

```ts
import { Model } from "mongoose";

export type TOverlayBase = {
  id: string;
  xPercent: number; // 0-100, free-form position (element's CENTER), not a preset anchor
  yPercent: number; // 0-100
  widthPercent?: number;
  rotationDeg?: number;
  zIndex?: number;
};

export type TTextOverlay = TOverlayBase & {
  type: "text";
  text: string;
  fontSizePx?: number;
  color?: string;
  fontWeight?: "normal" | "bold";
  align?: "left" | "center" | "right";
};

export type TButtonOverlay = TOverlayBase & {
  type: "button";
  label: string;
  href: string;
  bgColor?: string;
  textColor?: string;
};

export type TOverlay = TTextOverlay | TButtonOverlay;

export type TImageLeafData = {
  kind: "image";
  src: string;
  alt?: string;
  link?: string;
  overlays: TOverlay[];
};

export type TCarouselSlide = {
  id: string;
  src: string;
  alt?: string;
  link?: string;
  overlays: TOverlay[]; // per-slide, independent — not shared across the carousel
};

export type TCarouselLeafData = {
  kind: "carousel";
  slides: TCarouselSlide[];
  autoplayMs?: number;
  loop?: boolean;
};

export type TLeafNode = { id: string; type: "leaf" } & (
  | TImageLeafData
  | TCarouselLeafData
);

export type TSplitNode = {
  id: string;
  type: "split";
  direction: "horizontal" | "vertical";
  sizes: number[];
  children: TPanelNode[];
};

export type TPanelNode = TSplitNode | TLeafNode;

export type TBreakpoints = {
  laptop: TPanelNode;
  tablet: TPanelNode;
  mobile: TPanelNode;
};

export type TBannerTemplate = {
  _id: string;
  name: string;
  slug: string;
  breakpoints: TBreakpoints;
  isDeleted: boolean;
  createdBy: string;
};

export interface TBannerTemplateModel extends Model<TBannerTemplate> {
  findActiveById(id: string): Promise<TBannerTemplate | null>;
}
```

- [ ] **Step 4: Write `banner.constant.ts`**

```ts
export const MAX_TREE_DEPTH = 8;
```

- [ ] **Step 5: Write `banner.model.ts`**

```ts
import { model, Schema } from "mongoose";
import { TBannerTemplate, TBannerTemplateModel } from "./banner.interface";

const bannerTemplateSchema = new Schema<TBannerTemplate>(
  {
    name: { type: String, required: [true, "Template name is required"] },
    slug: { type: String, required: true },
    breakpoints: {
      laptop: { type: Schema.Types.Mixed, required: true },
      tablet: { type: Schema.Types.Mixed, required: true },
      mobile: { type: Schema.Types.Mixed, required: true },
    },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: String, required: true, ref: "User" },
  },
  { timestamps: true }
);

// A slug only has to be unique among non-deleted templates, so a name can
// be reused after its original template is (soft-)deleted.
bannerTemplateSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

bannerTemplateSchema.statics.findActiveById = async function (id: string) {
  return this.findOne({ _id: id, isDeleted: false });
};

// Deliberately a NEW collection name ("bannertemplates", Mongoose's
// default pluralization of "BannerTemplate") rather than reusing the old
// "banners" collection, which still holds one legacy gridSlider document
// on main — this avoids any chance of that stale doc surfacing in a
// find({}) against the new model. The old "banners" collection is orphaned
// and can be dropped manually in Mongo whenever convenient; it is not
// read by any code after this change.
export const BannerTemplate = model<TBannerTemplate, TBannerTemplateModel>(
  "BannerTemplate",
  bannerTemplateSchema
);
```

- [ ] **Step 6: Verify the project still typechecks (expected to show errors only in files Task 2 will fix)**

Run: `npx tsc --noEmit`
Expected: errors referencing `src/app/routes/index.ts` (still imports the now-deleted `BannerRoutes`) — this is expected and resolved in Task 2. No errors should appear anywhere else.

- [ ] **Step 7: Commit**

```bash
git add src/app/modules/banner/banner.interface.ts src/app/modules/banner/banner.constant.ts src/app/modules/banner/banner.model.ts src/app/modules/roles/roles.interface.ts
git commit -m "feat(banner): replace legacy single-template stub with generic template data layer"
```

Note: the deletion of the 4 legacy files and this commit's additions are staged together in the same commit — `git rm` in Step 1 already staged the deletions, so `git commit` here (after `git add`ing the new/modified files) captures both in one commit. Confirm with `git status` before committing that no unrelated files are staged.

---

## Task 2: Validation, service, controller, routes, registration

**Files:**
- Create: `src/app/modules/banner/banner.utils.ts`, `src/app/modules/banner/banner.validation.ts`, `src/app/modules/banner/banner.service.ts`, `src/app/modules/banner/banner.controller.ts`, `src/app/modules/banner/banner.routes.ts`
- Modify: `src/app/routes/index.ts`, `src/app/modules/customer/customerRoute.ts`

**Known issue surfaced by Task 1's typecheck (not caught when this plan was originally written):** `src/app/modules/customer/customerRoute.ts` imports `BannerController` from the now-deleted `../banner/banner.controller` and has a route `router.get("/banner/get-banner/:id", BannerController.getBanner)` — this is the **currently-deployed production route** the live `it-daily-homepage`'s `Banner.tsx` fetches today (mounted under `/customer`, so the real path is `/customer/banner/get-banner/gridSlider`). Remove the now-unused `BannerController` import and this one dead route line as part of this task — it cannot compile otherwise. **Deployment note (not a code concern, just worth recording):** removing this line means the currently-live homepage's hero banner will start returning nothing (`Banner.tsx`'s `if (!banner) return <></>;` fails soft — no crash, just an empty hero section) from the moment this backend change deploys, until the separate homepage-integration plan (which replaces `Banner.tsx` with the new package's `Renderer`) also ships. Whoever deploys this should be aware of that ordering.

**Interfaces:**
- Consumes: `TBannerTemplate`, `TBreakpoints`, `TBannerTemplateModel`, `BannerTemplate` model, `MAX_TREE_DEPTH` (Task 1).
- Produces: `BannerRoutes` (Express router) mounted at `/api/v1/banner` with routes `GET /get/:id` (public), `GET /get-all`, `POST /create`, `PATCH /update/:id`, `PATCH /rename/:id`, `POST /duplicate/:id`, `DELETE /delete/:id` (all auth+permission gated) — the package's Builder (a later plan) and the homepage's Renderer (a later plan) call these exact paths.

- [ ] **Step 1: Write `banner.utils.ts` (iterative depth guard)**

```ts
import httpStatus from "http-status";
import AppError from "../../errors/AppError";

/**
 * Deliberately iterative (explicit stack), not recursive: this runs
 * BEFORE the recursive Zod z.lazy() descent that validates the tree's
 * shape, specifically so an adversarial deeply-nested JSON body gets
 * rejected here first, on a cheap iterative walk, rather than risking a
 * stack overflow inside the recursive parser itself.
 */
export const assertTreeDepth = (root: unknown): void => {
  const stack: { node: unknown; depth: number }[] = [{ node: root, depth: 1 }];

  while (stack.length) {
    const { node, depth } = stack.pop()!;

    if (depth > 8) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Layout tree exceeds max depth of 8"
      );
    }

    const n = node as { type?: string; children?: unknown[] };
    if (n && n.type === "split" && Array.isArray(n.children)) {
      for (const child of n.children) {
        stack.push({ node: child, depth: depth + 1 });
      }
    }
  }
};
```

Note: the depth check is hardcoded to `8` here to match `MAX_TREE_DEPTH` from Task 1 (kept as a literal rather than importing the constant into this early-boundary utility, since this function's whole purpose is to run before any other validation layer — importing across files here is fine too if preferred, but the literal keeps this function trivially reviewable in isolation).

- [ ] **Step 2: Write `banner.validation.ts` (recursive Zod schema)**

```ts
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

const imageLeafDataSchema = z
  .object({
    kind: z.literal("image"),
    src: safeUrlSchema("Image source").min(1, "Image is required"),
    alt: z.string().optional(),
    link: safeUrlSchema("Link").optional(),
    overlays: z.array(overlaySchema).default([]),
  })
  .strict();

const carouselSlideSchema = z
  .object({
    id: z.string().min(1),
    src: safeUrlSchema("Slide image").min(1, "Slide image is required"),
    alt: z.string().optional(),
    link: safeUrlSchema("Link").optional(),
    overlays: z.array(overlaySchema).default([]),
  })
  .strict();

const carouselLeafDataSchema = z
  .object({
    kind: z.literal("carousel"),
    slides: z.array(carouselSlideSchema).min(1, "At least one slide is required"),
    autoplayMs: z.number().int().positive().optional(),
    loop: z.boolean().optional(),
  })
  .strict();

const leafNodeSchema = z.object({ id: z.string().min(1), type: z.literal("leaf") }).and(
  z.discriminatedUnion("kind", [imageLeafDataSchema, carouselLeafDataSchema])
);

type TPanelNodeInput =
  | z.infer<typeof leafNodeSchema>
  | {
      id: string;
      type: "split";
      direction: "horizontal" | "vertical";
      sizes: number[];
      children: TPanelNodeInput[];
    };

const panelNodeSchema: z.ZodType<TPanelNodeInput> = z.lazy(() =>
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
```

- [ ] **Step 3: Write `banner.service.ts`**

```ts
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { BannerTemplate } from "./banner.model";
import { TBreakpoints, TBannerTemplate } from "./banner.interface";
import { TUser } from "../user/user.interface";

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const generateUniqueSlug = async (name: string): Promise<string> => {
  const base = slugify(name) || "template";
  let candidate = base;
  let suffix = 1;
  while (await BannerTemplate.exists({ slug: candidate, isDeleted: false })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
};

const createTemplateIntoDB = async (
  payload: { name: string; breakpoints: TBreakpoints },
  admin: TUser
) => {
  const slug = await generateUniqueSlug(payload.name);
  return BannerTemplate.create({ ...payload, slug, createdBy: admin._id });
};

const getAllTemplatesFromDB = async () =>
  BannerTemplate.find({ isDeleted: false })
    .select("name slug createdAt updatedAt")
    .sort({ updatedAt: -1 });

const getTemplateByIdFromDB = async (id: string) => {
  const result = await BannerTemplate.findOne({ _id: id, isDeleted: false });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Banner template not found");
  }
  return result;
};

const updateTemplateIntoDB = async (
  id: string,
  payload: Partial<Pick<TBannerTemplate, "name" | "breakpoints">>
) => {
  const exists = await BannerTemplate.findOne({ _id: id, isDeleted: false });
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, "Banner template not found");
  }
  return BannerTemplate.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

const renameTemplateIntoDB = async (id: string, name: string) => {
  const exists = await BannerTemplate.findOne({ _id: id, isDeleted: false });
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, "Banner template not found");
  }
  return BannerTemplate.findByIdAndUpdate(id, { name }, { new: true });
};

const duplicateTemplateIntoDB = async (id: string, admin: TUser) => {
  const source = await BannerTemplate.findOne({ _id: id, isDeleted: false });
  if (!source) {
    throw new AppError(httpStatus.NOT_FOUND, "Banner template not found");
  }
  const name = `${source.name} (copy)`;
  const slug = await generateUniqueSlug(name);
  return BannerTemplate.create({
    name,
    slug,
    breakpoints: source.breakpoints,
    createdBy: admin._id,
  });
};

const deleteTemplateFromDB = async (id: string) => {
  const exists = await BannerTemplate.findOne({ _id: id, isDeleted: false });
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, "Banner template not found");
  }
  return BannerTemplate.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
};

export const BannerTemplateServices = {
  createTemplateIntoDB,
  getAllTemplatesFromDB,
  getTemplateByIdFromDB,
  updateTemplateIntoDB,
  renameTemplateIntoDB,
  duplicateTemplateIntoDB,
  deleteTemplateFromDB,
};
```

- [ ] **Step 4: Write `banner.controller.ts`**

```ts
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BannerTemplateServices } from "./banner.service";
import { assertTreeDepth } from "./banner.utils";

const assertBreakpointsDepth = (breakpoints?: Record<string, unknown>) => {
  if (!breakpoints) return;
  assertTreeDepth(breakpoints.laptop);
  assertTreeDepth(breakpoints.tablet);
  assertTreeDepth(breakpoints.mobile);
};

const createTemplate = catchAsync(async (req, res) => {
  const { userData } = req.user;
  assertBreakpointsDepth(req.body.breakpoints);

  const result = await BannerTemplateServices.createTemplateIntoDB(
    req.body,
    userData
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Banner template created successfully",
    data: result,
  });
});

const getAllTemplates = catchAsync(async (req, res) => {
  const result = await BannerTemplateServices.getAllTemplatesFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Fetched all banner templates successfully",
    data: result,
  });
});

const getTemplateById = catchAsync(async (req, res) => {
  const result = await BannerTemplateServices.getTemplateByIdFromDB(
    req.params.id
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Fetched banner template successfully",
    data: result,
  });
});

const updateTemplate = catchAsync(async (req, res) => {
  assertBreakpointsDepth(req.body.breakpoints);

  const result = await BannerTemplateServices.updateTemplateIntoDB(
    req.params.id,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Banner template updated successfully",
    data: result,
  });
});

const renameTemplate = catchAsync(async (req, res) => {
  const result = await BannerTemplateServices.renameTemplateIntoDB(
    req.params.id,
    req.body.name
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Banner template renamed successfully",
    data: result,
  });
});

const duplicateTemplate = catchAsync(async (req, res) => {
  const { userData } = req.user;
  const result = await BannerTemplateServices.duplicateTemplateIntoDB(
    req.params.id,
    userData
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Banner template duplicated successfully",
    data: result,
  });
});

const deleteTemplate = catchAsync(async (req, res) => {
  const result = await BannerTemplateServices.deleteTemplateFromDB(
    req.params.id
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Banner template deleted successfully",
    data: result,
  });
});

export const BannerTemplateController = {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  renameTemplate,
  duplicateTemplate,
  deleteTemplate,
};
```

- [ ] **Step 5: Write `banner.routes.ts`**

```ts
import { Router } from "express";
import checkPermission from "../../middleware/checkPermission";
import validateAuth from "../../middleware/auth";
import { EAppFeatures } from "../roles/roles.interface";
import { validateRequest } from "../../middleware/validateRequest";
import { BannerTemplateValidationSchema } from "./banner.validation";
import { BannerTemplateController } from "./banner.controller";

const router = Router();

// Public — consumed by the package's Renderer (e.g. an unauthenticated
// Next.js server-side fetch on the homepage) with no auth token, and
// reused as-is by the admin Builder to load a template for editing.
router.get("/get/:id", BannerTemplateController.getTemplateById);

router.get(
  "/get-all",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "read"),
  BannerTemplateController.getAllTemplates
);

router.post(
  "/create",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "create"),
  validateRequest(BannerTemplateValidationSchema.createTemplateValidationSchema),
  BannerTemplateController.createTemplate
);

router.patch(
  "/update/:id",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "update"),
  validateRequest(BannerTemplateValidationSchema.updateTemplateValidationSchema),
  BannerTemplateController.updateTemplate
);

router.patch(
  "/rename/:id",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "update"),
  validateRequest(BannerTemplateValidationSchema.renameTemplateValidationSchema),
  BannerTemplateController.renameTemplate
);

router.post(
  "/duplicate/:id",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "create"),
  BannerTemplateController.duplicateTemplate
);

router.delete(
  "/delete/:id",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "delete"),
  BannerTemplateController.deleteTemplate
);

export const BannerRoutes = router;
```

- [ ] **Step 6: Remove the dead banner route from `customerRoute.ts`**

Modify `src/app/modules/customer/customerRoute.ts`: remove the import `import { BannerController } from "../banner/banner.controller";` and the route line `router.get("/banner/get-banner/:id", BannerController.getBanner);`. Nothing else in this file changes.

- [ ] **Step 7: Register the module in `src/app/routes/index.ts`**

Add the import alongside the other module imports:

```ts
import { BannerRoutes } from "../modules/banner/banner.routes";
```

Add to the `moduleRoutes` array:

```ts
  { path: "/banner", route: BannerRoutes },
```

Update the auth-exemption check so the global wrapper does not double-apply `validateAuth()` in front of the module's own public `/get/:id` route (the module's own router already applies `validateAuth()` on every route except `/get/:id`):

```ts
moduleRoutes.forEach((route) => {
  if (route.path === "/auth" || route.path === "/customer" || route.path === "/banner") {
    router.use(route.path, route.route);
  } else {
    router.use(route.path, validateAuth(), route.route);
  }
});
```

- [ ] **Step 8: Manually verify with a typecheck**

Run: `npx tsc --noEmit`
Expected: clean, no errors anywhere (this resolves the expected errors from Task 1 Step 6).

- [ ] **Step 9: Manually verify the API with the dev server**

Run: `npm run dev`

Verify the public route requires no auth, and returns 404 for a nonexistent id:

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/banner/get/000000000000000000000000" -Method Get
```

Expected: `404 Not Found`, `{ success: false, message: "Banner template not found", ... }` — no auth header needed.

Verify an admin-gated route requires auth (expect `401`):

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/banner/get-all" -Method Get
```

With a valid admin JWT (`<TOKEN>`, obtained via the existing login flow) that has `banner` permission granted on its role:

```powershell
$body = @{
  name = "Homepage Hero"
  breakpoints = @{
    laptop = @{ id = "l1"; type = "leaf"; kind = "image"; src = "https://example.com/laptop.jpg"; overlays = @() }
    tablet = @{ id = "t1"; type = "leaf"; kind = "image"; src = "https://example.com/tablet.jpg"; overlays = @() }
    mobile = @{ id = "m1"; type = "leaf"; kind = "image"; src = "https://example.com/mobile.jpg"; overlays = @() }
  }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/banner/create" -Method Post -Headers @{ Authorization = "<TOKEN>" } -ContentType "application/json" -Body $body
```

Expected: `201 Created`, returns the new template with a generated `slug` ("homepage-hero"). Save its `_id` as `<ID>`, then verify the full round-trip:

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/banner/get-all" -Method Get -Headers @{ Authorization = "<TOKEN>" }
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/banner/get/<ID>" -Method Get
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/banner/rename/<ID>" -Method Patch -Headers @{ Authorization = "<TOKEN>" } -ContentType "application/json" -Body '{"name":"Homepage Hero v2"}'
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/banner/duplicate/<ID>" -Method Post -Headers @{ Authorization = "<TOKEN>" }
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/banner/delete/<ID>" -Method Delete -Headers @{ Authorization = "<TOKEN>" }
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/banner/get/<ID>" -Method Get
```

Expected in order: list includes the new template; `get/:id` returns the full `breakpoints` tree; rename succeeds; duplicate creates a second template named "Homepage Hero v2 (copy)" with slug "homepage-hero-v2-copy"; delete soft-deletes (sets `isDeleted: true`); the final `get/:id` on the deleted template now returns `404`.

Verify a `javascript:`-scheme URL is rejected (expect `400`):

```powershell
$badBody = @{
  name = "Bad"
  breakpoints = @{
    laptop = @{ id="l1"; type="leaf"; kind="image"; src="javascript:alert(1)"; overlays=@() }
    tablet = @{ id="t1"; type="leaf"; kind="image"; src="https://example.com/t.jpg"; overlays=@() }
    mobile = @{ id="m1"; type="leaf"; kind="image"; src="https://example.com/m.jpg"; overlays=@() }
  }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/banner/create" -Method Post -Headers @{ Authorization = "<TOKEN>" } -ContentType "application/json" -Body $badBody
```

Expected: `400 Bad Request` (Zod's `safeUrlSchema` refinement failure).

Verify a deeply-nested (>8 levels) split tree is rejected (expect `400` from `assertTreeDepth`, not a crash) — construct a `laptop` tree with 9 nested single-child... actually a split requires ≥2 children per the Zod schema, so build 9 levels of 2-child splits, e.g. via a small Node/PowerShell script that programmatically nests `{type:"split", direction:"horizontal", sizes:[50,50], children:[<leaf>, <next level>]}` 9 levels deep — confirm the request returns `400` with the "Layout tree exceeds max depth of 8" message rather than the server crashing or hanging.

- [ ] **Step 10: Commit**

```bash
git add src/app/modules/banner/banner.utils.ts src/app/modules/banner/banner.validation.ts src/app/modules/banner/banner.service.ts src/app/modules/banner/banner.controller.ts src/app/modules/banner/banner.routes.ts src/app/routes/index.ts src/app/modules/customer/customerRoute.ts
git commit -m "feat(banner): add CRUD API for generic banner templates"
```

---

## Handoff

Once this plan is executed, both later plans depend on these exact routes:
- The package's Renderer (already built in a separate plan) calls `GET /banner/get/:id`.
- The package's Builder (a separate, not-yet-written plan) will call `GET /banner/get-all`, `POST /banner/create`, `PATCH /banner/update/:id`, `PATCH /banner/rename/:id`, `POST /banner/duplicate/:id`, `DELETE /banner/delete/:id`.

One manual, non-code deploy note (not part of any task above): the old `banners` Mongo collection (holding the single legacy `gridSlider` document) is orphaned by this change — safe to `db.banners.drop()` once in each environment, or simply leave it inert since no code reads it anymore.
