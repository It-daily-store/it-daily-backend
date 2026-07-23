"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRoutes = void 0;
const express_1 = require("express");
const category_controller_1 = require("./category.controller");
const validateRequest_1 = require("../../middleware/validateRequest");
const category_validation_1 = require("./category.validation");
const checkPermission_1 = __importDefault(require("../../middleware/checkPermission"));
const roles_interface_1 = require("../roles/roles.interface");
const router = (0, express_1.Router)();
router.post("/create", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.category, "create"), (0, validateRequest_1.validateRequest)(category_validation_1.CategoryValidations.createCategoryValidationSchema), category_controller_1.CategoryControllers.createCategory);
router.get("/get-all", category_controller_1.CategoryControllers.getAllCategories);
router.get("/single/:id", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.category, "read"), category_controller_1.CategoryControllers.getSingleCategories);
router.delete("/:id", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.category, "delete"), category_controller_1.CategoryControllers.deleteCategory);
router.patch("/:id", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.category, "update"), (0, validateRequest_1.validateRequest)(category_validation_1.CategoryValidations.updateCategoryValidationSchema), category_controller_1.CategoryControllers.updateCategory);
exports.CategoryRoutes = router;
