"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterRoutes = void 0;
const express_1 = require("express");
const checkPermission_1 = __importDefault(require("../../middleware/checkPermission"));
const roles_interface_1 = require("../roles/roles.interface");
const filter_controller_1 = require("./filter.controller");
const validateRequest_1 = require("../../middleware/validateRequest");
const filter_validation_1 = require("./filter.validation");
const router = (0, express_1.Router)();
router.post("/create", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.productFilter, "create"), (0, validateRequest_1.validateRequest)(filter_validation_1.filterValidations.createFilterValidationSchema), filter_controller_1.FilterControllers.createFilter);
router.patch("/update/:id", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.productFilter, "update"), (0, validateRequest_1.validateRequest)(filter_validation_1.filterValidations.updateFilterValidationSchema), filter_controller_1.FilterControllers.updateFilter);
router.get("/get-all", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.productFilter, "read"), filter_controller_1.FilterControllers.getAllFilters);
router.delete("/delete/:id", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.productFilter, "delete"), filter_controller_1.FilterControllers.deleteFilter);
exports.FilterRoutes = router;
