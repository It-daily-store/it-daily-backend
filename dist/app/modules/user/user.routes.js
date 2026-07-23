"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const validateRequest_1 = require("../../middleware/validateRequest");
const user_validation_1 = require("./user.validation");
const checkPermission_1 = __importDefault(require("../../middleware/checkPermission"));
const roles_interface_1 = require("../roles/roles.interface");
const router = (0, express_1.Router)();
router.post("/create-admin", (0, validateRequest_1.validateRequest)(user_validation_1.UserValidations.createUserValidationSchema), (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.user, "create"), user_controller_1.UserController.createUser);
router.get("/admin/get-all", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.user, "read"), user_controller_1.UserController.getAllUsers);
router.delete("/:userId", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.user, "delete"), user_controller_1.UserController.deleteUser);
router.get("/:id", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.user, "read"), user_controller_1.UserController.getSingleUser);
exports.UserRoutes = router;
