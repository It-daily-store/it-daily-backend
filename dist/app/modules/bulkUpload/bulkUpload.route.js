"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUploadRoutes = void 0;
const express_1 = require("express");
const checkPermission_1 = __importDefault(require("../../middleware/checkPermission"));
const roles_interface_1 = require("../roles/roles.interface");
const bulkUpload_controller_1 = require("./bulkUpload.controller");
const router = (0, express_1.Router)();
router.get('/get-all', (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.bulkUpload, 'read'), bulkUpload_controller_1.BulkUploadHistoryController.getBulkUploadHistory);
exports.bulkUploadRoutes = router;
