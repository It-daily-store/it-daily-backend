import { Router } from "express";
import rateLimit from "express-rate-limit";
import checkPermission from "../../middleware/checkPermission";
import { validateRequest } from "../../middleware/validateRequest";
import { EAppModules } from "../roles/roles.interface";
import { MetaPixelController } from "./metaPixel.controller";
import { MetaPixelValidation } from "./metaPixel.validation";
import validateAuth from "../../middleware/auth";

const router = Router();

const ingressLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// Unauthenticated: the storefront needs this before any customer signs in.
router.get("/public-config", MetaPixelController.getPublicConfig);

// Unauthenticated: the storefront calls this directly to back up browser events.
router.post(
  "/events",
  ingressLimiter,
  validateRequest(MetaPixelValidation.IngestEventSchema),
  MetaPixelController.ingestEvent,
);

router.get(
  "/logs",
  validateAuth(),
  checkPermission(EAppModules.marketing, "can_read_meta_pixel_logs"),
  MetaPixelController.getLogs,
);

router.post(
  "/logs/:id/retry",
  validateAuth(),
  checkPermission(EAppModules.marketing, "can_retry_meta_pixel_event"),
  MetaPixelController.retryLog,
);

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

router.post(
  "/test-connection",
  validateAuth(),
  checkPermission(EAppModules.marketing, "can_update_marketing"),
  MetaPixelController.testConnection,
);

const MetaPixelRoutes = router;

export default MetaPixelRoutes;
