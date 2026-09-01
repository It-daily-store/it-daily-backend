import { Router } from "express";
import checkPermission from "../../middleware/checkPermission";
import validateAuth from "../../middleware/auth";
import { EAppFeatures } from "../roles/roles.interface";
import { validateRequest } from "../../middleware/validateRequest";
import { BannerTemplateValidationSchema } from "./banner.validation";
import { BannerTemplateController } from "./banner.controller";
import { checkBreakpointsDepth } from "./banner.utils";

const router = Router();

router.get(
  "/get/:id",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "read"),
  BannerTemplateController.getTemplateById,
);

router.get(
  "/get-all",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "read"),
  BannerTemplateController.getAllTemplates,
);

router.post(
  "/create",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "create"),
  checkBreakpointsDepth,
  validateRequest(
    BannerTemplateValidationSchema.createTemplateValidationSchema,
  ),
  BannerTemplateController.createTemplate,
);

router.patch(
  "/update/:id",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "update"),
  checkBreakpointsDepth,
  validateRequest(
    BannerTemplateValidationSchema.updateTemplateValidationSchema,
  ),
  BannerTemplateController.updateTemplate,
);

router.patch(
  "/rename/:id",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "update"),
  validateRequest(
    BannerTemplateValidationSchema.renameTemplateValidationSchema,
  ),
  BannerTemplateController.renameTemplate,
);

// Publishing a banner to the storefront is an update to the banner
// feature, not a separate capability — an admin who can edit templates can
// choose which one is live.
router.patch(
  "/set-active/:id",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "update"),
  validateRequest(BannerTemplateValidationSchema.setActiveValidationSchema),
  BannerTemplateController.setActiveTemplate,
);

router.post(
  "/duplicate/:id",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "create"),
  BannerTemplateController.duplicateTemplate,
);

router.delete(
  "/delete/:id",
  validateAuth(),
  checkPermission(EAppFeatures.banner, "delete"),
  BannerTemplateController.deleteTemplate,
);

export const BannerRoutes = router;
