"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductDetailsCategoryRoutes = void 0;
const express_1 = require("express");
const productDetailsCategory_controller_1 = require("./productDetailsCategory.controller");
const productDetailsCategory_validation_1 = require("./productDetailsCategory.validation");
const validateRequest_1 = require("../../middleware/validateRequest");
const checkPermission_1 = __importDefault(require("../../middleware/checkPermission"));
const roles_interface_1 = require("../roles/roles.interface");
const router = (0, express_1.Router)();
router.post("/create", (0, validateRequest_1.validateRequest)(productDetailsCategory_validation_1.ProductDetailsCategoryValidations.createProductDetailsCategoryValidationSchema), (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.productDetails, "create"), productDetailsCategory_controller_1.ProductDetailsCategoryControllers.createProductDetailsCategory);
router.patch("/update/:id", (0, validateRequest_1.validateRequest)(productDetailsCategory_validation_1.ProductDetailsCategoryValidations.updateProductDetailsCategoryValidationSchema), (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.productDetails, "update"), productDetailsCategory_controller_1.ProductDetailsCategoryControllers.updateProductDetailsCategory);
router.get("/single/:id", productDetailsCategory_controller_1.ProductDetailsCategoryControllers.getSingleProductDetailsCategory);
router.get("/get-all", productDetailsCategory_controller_1.ProductDetailsCategoryControllers.getAllProductDetailsCategory);
router.delete("/delete/:id", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.productDetails, "delete"), productDetailsCategory_controller_1.ProductDetailsCategoryControllers.deleteProductDetailsCategory);
exports.ProductDetailsCategoryRoutes = router;
