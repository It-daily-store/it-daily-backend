import { Router } from "express";
import checkPermission from "../../middleware/checkPermission";
import { EAppFeatures } from "../roles/roles.interface";
import { validateRequest } from "../../middleware/validateRequest";
import { SettingsValidationSchema } from "./settings.validation";
import { SettingsController } from "./settings.controller";

const router = Router();

// GET settings
router.get(
  "/",
  checkPermission(EAppFeatures.settings, "read"),
  SettingsController.getSettings
);

// UPDATE settings
router.put(
  "/",
  checkPermission(EAppFeatures.settings, "update"),
  validateRequest(SettingsValidationSchema.UpdateSettingsSchema),
  SettingsController?.updateSettings
);

const SettingsRoute = router;

export default SettingsRoute;
