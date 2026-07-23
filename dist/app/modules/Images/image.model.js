"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Image = void 0;
const mongoose_1 = require("mongoose");
const ImageSchema = new mongoose_1.Schema({
    height: {
        type: Number,
        required: [true, 'Image height is required']
    },
    width: {
        type: Number,
        required: [true, 'Image width is required']
    },
    image: {
        type: String,
        required: [true, 'Image url is required']
    },
    extension: {
        type: String,
        required: [true, 'Image extension is required']
    },
    name: {
        type: String,
        required: [true, 'Image name is required']
    },
    size: {
        type: Number,
        required: [true, 'Image size is required']
    },
    image_type: {
        type: String,
        required: [true, 'Image name is required']
    },
    public_id: {
        type: String,
        required: [true, 'Image public id is required']
    },
    folder: {
        type: String,
        ref: "GalleryFolder"
    }
}, {
    timestamps: true
});
exports.Image = (0, mongoose_1.model)('Image', ImageSchema);
