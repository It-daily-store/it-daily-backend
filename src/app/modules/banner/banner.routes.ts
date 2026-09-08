import { Router } from "express";
import checkPermission from "../../middleware/checkPermission";
import validateAuth from "../../middleware/auth";
import { EAppModules } from "../roles/roles.interface";
import { validateRequest } from "../../middleware/validateRequest";
import { BannerTemplateValidationSchema } from "./banner.validation";
import { BannerTemplateController } from "./banner.controller";
import { checkBreakpointsDepth } from "./banner.utils";

const router = Router();

router.get(
  "/get/:id",
  validateAuth(),
  checkPermission(EAppModules.banner, "can_read_banner_details"),
  BannerTemplateController.getTemplateById,
);

router.get(
  "/get-all",
  validateAuth(),
  checkPermission(EAppModules.banner, "can_read_all_banners"),
  BannerTemplateController.getAllTemplates,
);

router.post(
  "/create",
  validateAuth(),
  checkPermission(EAppModules.banner, "can_create_banner"),
  checkBreakpointsDepth,
  validateRequest(
    BannerTemplateValidationSchema.createTemplateValidationSchema,
  ),
  BannerTemplateController.createTemplate,
);

router.patch(
  "/update/:id",
  validateAuth(),
  checkPermission(EAppModules.banner, "can_update_banner"),
  checkBreakpointsDepth,
  validateRequest(
    BannerTemplateValidationSchema.updateTemplateValidationSchema,
  ),
  BannerTemplateController.updateTemplate,
);

router.patch(
  "/rename/:id",
  validateAuth(),
  checkPermission(EAppModules.banner, "can_rename_banner"),
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
  checkPermission(EAppModules.banner, "can_publish_banner"),
  validateRequest(BannerTemplateValidationSchema.setActiveValidationSchema),
  BannerTemplateController.setActiveTemplate,
);

router.post(
  "/duplicate/:id",
  validateAuth(),
  checkPermission(EAppModules.banner, "can_duplicate_banner"),
  BannerTemplateController.duplicateTemplate,
);

router.delete(
  "/delete/:id",
  validateAuth(),
  checkPermission(EAppModules.banner, "can_delete_banner"),
  BannerTemplateController.deleteTemplate,
);

export const BannerRoutes = router;
