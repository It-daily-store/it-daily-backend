# Banner Templates Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single hardcoded `gridSlider` banner document with a `banners` collection holding exactly 3 permanent, admin-editable template documents (`carousel`, `splitGrid`, `sideBanner`), plus the CRUD/activation API the admin panel and public homepage will consume.

**Architecture:** Rewrite the existing `src/app/modules/banner/` module: a Mongoose model with a loose `data: Mixed` field (validated per-template by Zod at the route layer, not by Mongoose schema shape, since the 3 templates have different shapes), a service layer with a lazy-upsert `getAllBanners` (so the 3 fixed docs self-heal into existence on first read — no manual seed script), and an Express router with one public route (`GET /active`, for the homepage) and several auth+permission-gated admin routes.

**Tech Stack:** Express, Mongoose, Zod (`validateRequest` middleware), the existing `checkPermission`/`validateAuth` middleware, `catchAsync`/`sendResponse`/`AppError` utilities — all mirroring the `brand` module's conventions exactly.

## Global Constraints

- Full design context: see `e:\itdaily\id-daily-admin\docs\superpowers\specs\2026-07-31-banner-templates-design.md` (design spec, in the admin repo).
- Fixed template IDs, exactly 3, never created/deleted by admin: `"carousel" | "splitGrid" | "sideBanner"`.
- Every image slot is `{ mobile: string, tablet: string, laptop: string }`, all 3 required.
- All text/CTA/link fields (`headline`, `subtext`, `ctaLabel`, `ctaLink`, `link`) are optional strings.
- Carousel requires `slides.length >= 1`.
- Exactly one template is active at all times; `set-active` on one flips the other two to `active: false`.
- `GET /banner/active` must be reachable with **no auth token** (the public homepage has no session/cookie). All other banner routes require `validateAuth()` + `checkPermission(EAppFeatures.banner, ...)`, matching the `brand` module.
- No automated test framework exists in this repo (`npm test` is a stub). Verification is manual: run `npm run dev` (port 8000, mounted under `/api/v1`) and hit endpoints with `curl`/PowerShell `Invoke-RestMethod`, or a disposable one-off script deleted before committing.
- Follow existing module conventions exactly (see `brand` module) — do not introduce new response/error/validation patterns.

---

## File Structure

- Create: `src/app/modules/banner/banner.interface.ts` — TS types (`TBannerTemplateId`, `TImageSlot`, per-template data shapes, `TBanner`).
- Create: `src/app/modules/banner/banner.constant.ts` — `BANNER_TEMPLATE_IDS` array + `DEFAULT_BANNER_DATA` seed values.
- Modify: `src/app/modules/banner/banner.model.ts` — rewrite from the single-shape `gridSlider` schema to the 3-doc `templateId`-keyed schema.
- Create: `src/app/modules/banner/banner.validation.ts` — Zod schemas, one per template's update payload.
- Modify: `src/app/modules/banner/banner.service.ts` — rewrite: `getAllBannersFromDB` (lazy-upsert), `getActiveBannerFromDB`, `updateBannerFromDB`, `setActiveBannerFromDB`.
- Modify: `src/app/modules/banner/banner.controller.ts` — rewrite to match the new service functions and routes.
- Modify: `src/app/modules/banner/banner.routes.ts` — rewrite with the new routes, auth, and permission gates.
- Modify: `src/app/modules/roles/roles.interface.ts` — add `banner = "banner"` to `EAppFeatures`.
- Modify: `src/app/routes/index.ts` — register `BannerRoutes` at `/banner`, and add `/banner` to the no-global-`validateAuth()` exemption list (since `/active` must stay public; the module's own router applies `validateAuth()` per-route for everything else).

---

## Task 1: Banner data layer (types, model, service)

**Files:**
- Create: `src/app/modules/banner/banner.interface.ts`
- Create: `src/app/modules/banner/banner.constant.ts`
- Modify: `src/app/modules/banner/banner.model.ts`
- Modify: `src/app/modules/banner/banner.service.ts`

**Interfaces:**
- Produces: `TBannerTemplateId`, `TImageSlot`, `TCarouselData`, `TSplitGridData`, `TSideBannerData`, `TBannerData`, `TBanner` (from `banner.interface.ts`); `BANNER_TEMPLATE_IDS: TBannerTemplateId[]` (from `banner.constant.ts`); `Banner` Mongoose model (from `banner.model.ts`); `BannerServices.{getAllBannersFromDB, getActiveBannerFromDB, updateBannerFromDB, setActiveBannerFromDB}` (from `banner.service.ts`) — Task 2's controller consumes all of these by exact name.

- [ ] **Step 1: Write `banner.interface.ts`**

```ts
import { Model } from "mongoose";

export type TBannerTemplateId = "carousel" | "splitGrid" | "sideBanner";

export type TImageSlot = {
  mobile: string;
  tablet: string;
  laptop: string;
};

export type TCarouselSlide = {
  images: TImageSlot;
  headline?: string;
  subtext?: string;
  ctaLabel?: string;
  ctaLink?: string;
};

export type TCarouselData = {
  slides: TCarouselSlide[];
};

export type TSplitGridTextTile = {
  images: TImageSlot;
  headline?: string;
  subtext?: string;
  ctaLabel?: string;
  ctaLink?: string;
};

export type TSplitGridLinkTile = {
  images: TImageSlot;
  link?: string;
};

export type TSplitGridData = {
  main: TSplitGridTextTile;
  top: TSplitGridLinkTile;
  bottom: TSplitGridLinkTile;
};

export type TSideBannerData = {
  images: TImageSlot;
  headline?: string;
  subtext?: string;
  ctaLabel?: string;
  ctaLink?: string;
};

export type TBannerData = TCarouselData | TSplitGridData | TSideBannerData;

export type TBanner = {
  _id: string;
  templateId: TBannerTemplateId;
  active: boolean;
  data: TBannerData;
};

export interface TBannerModel extends Model<TBanner> {
  findByTemplateId(templateId: TBannerTemplateId): Promise<TBanner | null>;
}
```

- [ ] **Step 2: Write `banner.constant.ts`**

```ts
import { TBannerTemplateId, TBannerData } from "./banner.interface";

export const BANNER_TEMPLATE_IDS: TBannerTemplateId[] = [
  "carousel",
  "splitGrid",
  "sideBanner",
];

const emptyImageSlot = { mobile: "", tablet: "", laptop: "" };

export const DEFAULT_BANNER_DATA: Record<TBannerTemplateId, TBannerData> = {
  carousel: {
    slides: [{ images: { ...emptyImageSlot } }],
  },
  splitGrid: {
    main: { images: { ...emptyImageSlot } },
    top: { images: { ...emptyImageSlot } },
    bottom: { images: { ...emptyImageSlot } },
  },
  sideBanner: {
    images: { ...emptyImageSlot },
  },
};
```

- [ ] **Step 3: Rewrite `banner.model.ts`**

```ts
import { model, Schema } from "mongoose";
import { TBanner, TBannerModel, TBannerTemplateId } from "./banner.interface";
import { BANNER_TEMPLATE_IDS } from "./banner.constant";

const bannerSchema = new Schema<TBanner>({
  templateId: {
    type: String,
    enum: BANNER_TEMPLATE_IDS,
    required: true,
    unique: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Schema.Types.Mixed,
    default: {},
  },
});

bannerSchema.statics.findByTemplateId = async function (
  templateId: TBannerTemplateId
) {
  return this.findOne({ templateId });
};

export const Banner = model<TBanner, TBannerModel>("banners", bannerSchema);
```

Note: this intentionally replaces the old `IGridSliderTemplate` schema entirely (breaking change to the `banners` collection's shape) — the old single `{ id: "gridSlider", ... }` document is superseded; Task 1's manual verification (Step 5 below) confirms the new shape is created correctly. The stale old document (if any exists in your local/dev DB) is harmless — it simply won't match any of the 3 `templateId` values the new code queries for, and can be deleted manually via a Mongo client if you want to tidy the collection; this is not part of an automated task since it's a one-time dev-data cleanup, not application logic.

- [ ] **Step 4: Rewrite `banner.service.ts`**

```ts
import { Banner } from "./banner.model";
import { BANNER_TEMPLATE_IDS, DEFAULT_BANNER_DATA } from "./banner.constant";
import { TBannerData, TBannerTemplateId } from "./banner.interface";

const ensureBannersSeeded = async () => {
  const existing = await Banner.find();
  const existingIds = new Set(existing.map((b) => b.templateId));
  const missingIds = BANNER_TEMPLATE_IDS.filter((id) => !existingIds.has(id));

  if (missingIds.length > 0) {
    const noneActiveYet = existing.every((b) => !b.active);
    const toInsert = missingIds.map((templateId) => ({
      templateId,
      active: noneActiveYet && templateId === "carousel",
      data: DEFAULT_BANNER_DATA[templateId],
    }));
    await Banner.insertMany(toInsert);
  }
};

const getAllBannersFromDB = async () => {
  await ensureBannersSeeded();
  return Banner.find();
};

const getActiveBannerFromDB = async () => {
  await ensureBannersSeeded();
  return Banner.findOne({ active: true });
};

const updateBannerFromDB = async (
  templateId: TBannerTemplateId,
  data: TBannerData
) => {
  return Banner.findOneAndUpdate(
    { templateId },
    { data },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
};

const setActiveBannerFromDB = async (templateId: TBannerTemplateId) => {
  await Banner.updateMany({ templateId: { $ne: templateId } }, { active: false });

  return Banner.findOneAndUpdate(
    { templateId },
    { active: true },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
};

export const BannerServices = {
  getAllBannersFromDB,
  getActiveBannerFromDB,
  updateBannerFromDB,
  setActiveBannerFromDB,
};
```

- [ ] **Step 5: Manually verify the data layer with a disposable script**

Create a temporary file `src/scripts/verify-banner-temp.ts` (this file is deleted at the end of this step — it is not part of the plan's file structure):

```ts
import mongoose from "mongoose";
import config from "../app/config";
import { BannerServices } from "../app/modules/banner/banner.service";

const main = async () => {
  await mongoose.connect(config.database_url as string);

  console.log("--- getAllBannersFromDB (first call, should insert 3 docs) ---");
  console.log(await BannerServices.getAllBannersFromDB());

  console.log("--- getActiveBannerFromDB (should be templateId: carousel) ---");
  console.log(await BannerServices.getActiveBannerFromDB());

  console.log("--- setActiveBannerFromDB('sideBanner') ---");
  console.log(await BannerServices.setActiveBannerFromDB("sideBanner"));

  console.log("--- getActiveBannerFromDB again (should now be sideBanner) ---");
  console.log(await BannerServices.getActiveBannerFromDB());

  console.log("--- updateBannerFromDB('sideBanner', {...}) ---");
  console.log(
    await BannerServices.updateBannerFromDB("sideBanner", {
      images: { mobile: "m.jpg", tablet: "t.jpg", laptop: "l.jpg" },
      headline: "Test headline",
    })
  );

  await mongoose.disconnect();
};

main();
```

Run: `npx ts-node src/scripts/verify-banner-temp.ts`

Expected output: the first call logs 3 documents (`carousel` active, `splitGrid` and `sideBanner` inactive, each with empty-string image placeholders); the active banner is `carousel`; after `setActiveBannerFromDB`, the active banner becomes `sideBanner` and `carousel`/`splitGrid` are inactive; the final update call returns the `sideBanner` doc with the new `data`.

- [ ] **Step 6: Delete the temporary verification script**

```bash
rm src/scripts/verify-banner-temp.ts
```

- [ ] **Step 7: Commit**

```bash
git add src/app/modules/banner/banner.interface.ts src/app/modules/banner/banner.constant.ts src/app/modules/banner/banner.model.ts src/app/modules/banner/banner.service.ts
git commit -m "feat(banner): rewrite data layer for 3-template banner system"
```

---

## Task 2: Validation, controller, routes, and registration

**Files:**
- Create: `src/app/modules/banner/banner.validation.ts`
- Modify: `src/app/modules/banner/banner.controller.ts`
- Modify: `src/app/modules/banner/banner.routes.ts`
- Modify: `src/app/modules/roles/roles.interface.ts`
- Modify: `src/app/routes/index.ts`

**Interfaces:**
- Consumes: `BannerServices.{getAllBannersFromDB, getActiveBannerFromDB, updateBannerFromDB, setActiveBannerFromDB}`, `BANNER_TEMPLATE_IDS`, `TBannerTemplateId` (Task 1).
- Produces: `BannerRoutes` (Express router) mounted at `/api/v1/banner` with routes `GET /active` (public), `GET /get-all`, `PATCH /update/carousel`, `PATCH /update/splitGrid`, `PATCH /update/sideBanner`, `PATCH /set-active/:templateId` (all auth+permission gated) — the admin frontend plan calls these exact paths.

- [ ] **Step 1: Add `banner` to `EAppFeatures`**

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

- [ ] **Step 2: Write `banner.validation.ts`**

```ts
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
```

- [ ] **Step 3: Rewrite `banner.controller.ts`**

```ts
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import AppError from "../../errors/AppError";
import { BannerServices } from "./banner.service";
import { BANNER_TEMPLATE_IDS } from "./banner.constant";
import { TBannerTemplateId } from "./banner.interface";

const assertValidTemplateId = (id: string): TBannerTemplateId => {
  if (!BANNER_TEMPLATE_IDS.includes(id as TBannerTemplateId)) {
    throw new AppError(httpStatus.BAD_REQUEST, `Invalid banner templateId: ${id}`);
  }
  return id as TBannerTemplateId;
};

const getAllBanners = catchAsync(async (req, res) => {
  const result = await BannerServices.getAllBannersFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Fetched all banner templates successfully",
    data: result,
  });
});

const getActiveBanner = catchAsync(async (req, res) => {
  const result = await BannerServices.getActiveBannerFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Fetched active banner successfully",
    data: result,
  });
});

const updateCarousel = catchAsync(async (req, res) => {
  const result = await BannerServices.updateBannerFromDB("carousel", req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Carousel banner updated successfully",
    data: result,
  });
});

const updateSplitGrid = catchAsync(async (req, res) => {
  const result = await BannerServices.updateBannerFromDB("splitGrid", req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Split grid banner updated successfully",
    data: result,
  });
});

const updateSideBanner = catchAsync(async (req, res) => {
  const result = await BannerServices.updateBannerFromDB("sideBanner", req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Side banner updated successfully",
    data: result,
  });
});

const setActiveBanner = catchAsync(async (req, res) => {
  const templateId = assertValidTemplateId(req.params.templateId);
  const result = await BannerServices.setActiveBannerFromDB(templateId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Active banner template updated successfully",
    data: result,
  });
});

export const BannerController = {
  getAllBanners,
  getActiveBanner,
  updateCarousel,
  updateSplitGrid,
  updateSideBanner,
  setActiveBanner,
};
```

- [ ] **Step 4: Rewrite `banner.routes.ts`**

```ts
import { Router } from "express";
import { BannerController } from "./banner.controller";
import { BannerValidationSchema } from "./banner.validation";
import { validateRequest } from "../../middleware/validateRequest";
import checkPermission from "../../middleware/checkPermission";
import validateAuth from "../../middleware/auth";
import { EAppFeatures } from "../roles/roles.interface";

const router = Router();

// Public — consumed by the homepage with no auth token.
router.get("/active", BannerController.getActiveBanner);

router.get(
  "/get-all",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "read"),
  BannerController.getAllBanners
);

router.patch(
  "/update/carousel",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "update"),
  validateRequest(BannerValidationSchema.updateCarouselValidationSchema),
  BannerController.updateCarousel
);

router.patch(
  "/update/splitGrid",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "update"),
  validateRequest(BannerValidationSchema.updateSplitGridValidationSchema),
  BannerController.updateSplitGrid
);

router.patch(
  "/update/sideBanner",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "update"),
  validateRequest(BannerValidationSchema.updateSideBannerValidationSchema),
  BannerController.updateSideBanner
);

router.patch(
  "/set-active/:templateId",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "update"),
  BannerController.setActiveBanner
);

export const BannerRoutes = router;
```

- [ ] **Step 5: Register the module in `src/app/routes/index.ts`**

Add the import alongside the other module imports:

```ts
import { BannerRoutes } from "../modules/banner/banner.routes";
```

Add to the `moduleRoutes` array:

```ts
  { path: "/banner", route: BannerRoutes },
```

Update the auth-exemption check so the global wrapper does not double-apply `validateAuth()` in front of the module's own public `/active` route (the module's router already applies `validateAuth()` itself on every route except `/active`):

```ts
moduleRoutes.forEach((route) => {
  if (route.path === "/auth" || route.path === "/customer" || route.path === "/banner") {
    router.use(route.path, route.route);
  } else {
    router.use(route.path, validateAuth(), route.route);
  }
});
```

- [ ] **Step 6: Manually verify the API with the dev server**

Run: `npm run dev`

In a separate terminal, verify the public route requires no auth:

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/banner/active" -Method Get
```

Expected: `200 OK`, JSON body with `data.templateId` equal to whichever template is currently active. On a brand-new database this call alone lazily seeds the 3 documents (via `ensureBannersSeeded`) and returns `carousel` as the active one — no prior admin action is required for the public endpoint to work correctly on a fresh deploy.

Then verify an admin-gated route requires auth (expect `401`):

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/banner/get-all" -Method Get
```

Then verify it works with a valid token (replace `<TOKEN>` with a real admin JWT obtained via the existing login flow — e.g. from the admin app's browser devtools after logging in, or via `POST /api/v1/auth/login`):

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/banner/get-all" -Method Get -Headers @{ Authorization = "<TOKEN>" }
```

Expected: `200 OK`, `data` is an array of 3 banner documents (seeded on first call).

Then verify an update + set-active round-trip:

```powershell
$body = @{ images = @{ mobile = "m.jpg"; tablet = "t.jpg"; laptop = "l.jpg" }; headline = "Hello" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/banner/update/sideBanner" -Method Patch -Headers @{ Authorization = "<TOKEN>" } -ContentType "application/json" -Body $body

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/banner/set-active/sideBanner" -Method Patch -Headers @{ Authorization = "<TOKEN>" }

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/banner/active" -Method Get
```

Expected: the update returns the updated `sideBanner` doc; `set-active` returns it with `active: true`; the final `/active` call now returns the `sideBanner` template with the headline you just set.

Also verify validation rejects a bad payload (missing a required image, expect `400`):

```powershell
$badBody = @{ images = @{ mobile = "m.jpg" } } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/banner/update/sideBanner" -Method Patch -Headers @{ Authorization = "<TOKEN>" } -ContentType "application/json" -Body $badBody
```

Expected: `400 Bad Request` (Zod validation failure on missing `tablet`/`laptop`).

- [ ] **Step 7: Commit**

```bash
git add src/app/modules/banner/banner.validation.ts src/app/modules/banner/banner.controller.ts src/app/modules/banner/banner.routes.ts src/app/modules/roles/roles.interface.ts src/app/routes/index.ts
git commit -m "feat(banner): add CRUD + activation API for banner templates"
```

---

## Handoff to the admin frontend plan

Once this plan is executed, the admin frontend (separate plan, in `id-daily-admin`) will call:
- `GET /banner/get-all`
- `PATCH /banner/update/carousel` / `/update/splitGrid` / `/update/sideBanner`
- `PATCH /banner/set-active/:templateId`

And the homepage (separate plan, in `it-daily-homepage`) will call:
- `GET /banner/active`
