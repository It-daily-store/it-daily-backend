import { Router } from "express";
import checkPermission from "../../middleware/checkPermission";
import validateAuth from "../../middleware/auth";
import { EAppFeatures } from "../roles/roles.interface";
import { validateRequest } from "../../middleware/validateRequest";
import { BannerTemplateValidationSchema } from "./banner.validation";
import { BannerTemplateController } from "./banner.controller";
import { checkBreakpointsDepth } from "./banner.utils";

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
  checkBreakpointsDepth,
  validateRequest(BannerTemplateValidationSchema.createTemplateValidationSchema),
  BannerTemplateController.createTemplate
);

router.patch(
  "/update/:id",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "update"),
  checkBreakpointsDepth,
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
