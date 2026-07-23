"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryFolder = void 0;
const mongoose_1 = require("mongoose");
const GalleryFolderSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Folder name is required"]
    },
    parent_id: {
        type: String,
        default: null,
        ref: "GalleryFolder"
    }
});
exports.GalleryFolder = (0, mongoose_1.model)('GalleryFolder', GalleryFolderSchema);
