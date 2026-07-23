"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const checkPermission_1 = __importDefault(require("../../middleware/checkPermission"));
const roles_interface_1 = require("../roles/roles.interface");
const validateRequest_1 = require("../../middleware/validateRequest");
const settings_validation_1 = require("./settings.validation");
const settings_controller_1 = require("./settings.controller");
const router = (0, express_1.Router)();
// GET settings
router.get("/", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.settings, "read"), settings_controller_1.SettingsController.getSettings);
// UPDATE settings
router.put("/", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.settings, "update"), (0, validateRequest_1.validateRequest)(settings_validation_1.SettingsValidationSchema.UpdateSettingsSchema), settings_controller_1.SettingsController === null || settings_controller_1.SettingsController === void 0 ? void 0 : settings_controller_1.SettingsController.updateSettings);
const SettingsRoute = router;
exports.default = SettingsRoute;
