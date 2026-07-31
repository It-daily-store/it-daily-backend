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
