"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageRoutes = void 0;
const express_1 = require("express");
const image_multer_1 = __importDefault(require("../../lib/image/image.multer"));
const image_controller_1 = require("./image.controller");
const checkPermission_1 = __importDefault(require("../../middleware/checkPermission"));
const roles_interface_1 = require("../roles/roles.interface");
const router = (0, express_1.Router)();
router.post("/upload-image", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.photo, "create"), image_multer_1.default.array("photos", 5), image_controller_1.ImageUploadController.uploadImage);
router.get("/get-all", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.photo, "read"), image_controller_1.ImageUploadController.getAllImages);
router.delete("/delete-images", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.photo, "delete"), image_controller_1.ImageUploadController.deleteImages);
exports.ImageRoutes = router;
