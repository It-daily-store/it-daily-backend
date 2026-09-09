import { Router } from "express";
import checkPermission from "../../middleware/checkPermission";
import { validateRequest } from "../../middleware/validateRequest";
import { EAppModules } from "../roles/roles.interface";
import { MetaPixelController } from "./metaPixel.controller";
import { MetaPixelValidation } from "./metaPixel.validation";
import validateAuth from "../../middleware/auth";

const router = Router();

// Unauthenticated: the storefront needs this before any customer signs in.
router.get("/public-config", MetaPixelController.getPublicConfig);

router.get(
  "/config",
  validateAuth(),
  checkPermission(EAppModules.marketing, "can_read_marketing"),
  MetaPixelController.getConfig,
);

router.put(
  "/config",
  validateAuth(),
  checkPermission(EAppModules.marketing, "can_update_marketing"),
  validateRequest(MetaPixelValidation.UpdateConfigSchema),
  MetaPixelController.updateConfig,
);

router.post(
  "/preview-payload",
  validateAuth(),
  checkPermission(EAppModules.marketing, "can_read_marketing"),
  validateRequest(MetaPixelValidation.PreviewPayloadSchema),
  MetaPixelController.previewPayload,
);

const MetaPixelRoutes = router;

export default MetaPixelRoutes;
