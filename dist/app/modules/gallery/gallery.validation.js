"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryFolderValidatonSchema = void 0;
const zod_1 = require("zod");
const createGalleryFolderValidationSchema = zod_1.z.object({
    name: zod_1.z.string({ required_error: 'Folder name is required' }),
    parent_id: zod_1.z.string().nullable().optional()
});
exports.GalleryFolderValidatonSchema = { createGalleryFolderValidationSchema };
