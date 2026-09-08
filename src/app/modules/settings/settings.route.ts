import { Router } from "express";
import checkPermission from "../../middleware/checkPermission";
import { EAppModules } from "../roles/roles.interface";
import { validateRequest } from "../../middleware/validateRequest";
import { SettingsValidationSchema } from "./settings.validation";
import { SettingsController } from "./settings.controller";

const router = Router();

// GET settings
router.get(
  "/",
  checkPermission(EAppModules.settings, "can_read_settings"),
  SettingsController.getSettings
);

// UPDATE settings
router.put(
  "/",
  checkPermission(EAppModules.settings, "can_update_settings"),
  validateRequest(SettingsValidationSchema.UpdateSettingsSchema),
  SettingsController?.updateSettings
);

const SettingsRoute = router;

export default SettingsRoute;
