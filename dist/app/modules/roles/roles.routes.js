"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesRoutes = void 0;
const express_1 = require("express");
const roles_controller_1 = require("./roles.controller");
const validateRequest_1 = require("../../middleware/validateRequest");
const roles_validation_1 = require("./roles.validation");
const checkPermission_1 = __importDefault(require("../../middleware/checkPermission"));
const roles_interface_1 = require("./roles.interface");
const router = (0, express_1.Router)();
router.post("/create-role", (0, validateRequest_1.validateRequest)(roles_validation_1.RolesValidations.createRoleValidationSchema), (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.role, "create"), roles_controller_1.RolesController.createRole);
router.get("/get-all", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.role, "read"), roles_controller_1.RolesController.getAllRoles);
router.patch("/update-role/:id", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.role, "update"), roles_controller_1.RolesController.updateRole);
router.delete("/delete-role/:id", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.role, "delete"), roles_controller_1.RolesController.deleteRole);
exports.RolesRoutes = router;
