"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.galleryRoutes = void 0;
const express_1 = require("express");
const validateRequest_1 = require("../../middleware/validateRequest");
const gallery_validation_1 = require("./gallery.validation");
const gallery_controller_1 = require("./gallery.controller");
const checkPermission_1 = __importDefault(require("../../middleware/checkPermission"));
const roles_interface_1 = require("../roles/roles.interface");
const router = (0, express_1.Router)();
router.post('/create-folder', (0, validateRequest_1.validateRequest)(gallery_validation_1.GalleryFolderValidatonSchema.createGalleryFolderValidationSchema), (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.gallery, 'create'), gallery_controller_1.GalleryFolderController.createGalleryFolder);
router.get('/get-folders', (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.gallery, 'read'), gallery_controller_1.GalleryFolderController.getFolders);
router.patch('/update-folder/:id', (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.gallery, 'update'), gallery_controller_1.GalleryFolderController.updateFolder);
router.delete('/delete/:id', (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.gallery, 'delete'), gallery_controller_1.GalleryFolderController.deleteFolder);
exports.galleryRoutes = router;
