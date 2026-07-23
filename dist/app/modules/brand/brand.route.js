"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandRoutes = void 0;
const express_1 = require("express");
const checkPermission_1 = __importDefault(require("../../middleware/checkPermission"));
const roles_interface_1 = require("../roles/roles.interface");
const brand_controller_1 = require("./brand.controller");
const validateRequest_1 = require("../../middleware/validateRequest");
const brand_validation_1 = require("./brand.validation");
const router = (0, express_1.Router)();
router.post('/create', (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.brand, 'create'), (0, validateRequest_1.validateRequest)(brand_validation_1.BrandValidationSchema.createBrandValidationSchema), brand_controller_1.BrandController.createBrand);
router.patch('/update/:id', (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.brand, 'update'), (0, validateRequest_1.validateRequest)(brand_validation_1.BrandValidationSchema.updateBrandValidationSchema), brand_controller_1.BrandController.updateBrand);
router.get('/get-all', (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.brand, 'read'), brand_controller_1.BrandController.getAllBrands);
router.delete('/delete/:id', (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.brand, 'delete'), brand_controller_1.BrandController.deleteBrand);
exports.BrandRoutes = router;
