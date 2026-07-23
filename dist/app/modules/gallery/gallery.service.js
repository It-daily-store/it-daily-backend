"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryFolderService = void 0;
const gallery_model_1 = require("./gallery.model");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const image_model_1 = require("../Images/image.model");
const createGalleryFolderIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    let parent_id = payload.parent_id || null;
    if (payload.parent_id) {
        const exist = yield gallery_model_1.GalleryFolder.findById(payload.parent_id);
        if (!exist) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, 'parent does not exist');
        }
    }
    const result = yield gallery_model_1.GalleryFolder.create({ name: payload.name, parent_id });
    return result;
});
const getFoldersFromDB = (folder) => __awaiter(void 0, void 0, void 0, function* () {
    const parent_id = folder || null;
    const result = yield gallery_model_1.GalleryFolder.find({ parent_id });
    return result;
});
const updateFolderIntoDB = (id, name) => __awaiter(void 0, void 0, void 0, function* () {
    const exist = yield gallery_model_1.GalleryFolder.findById(id);
    if (!exist) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, 'folder does not exist');
    }
    const result = yield gallery_model_1.GalleryFolder.findByIdAndUpdate(id, { name }, { new: true });
    return result;
});
const deleteFolderFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const hasFolder = yield gallery_model_1.GalleryFolder.findOne({ parent_id: id });
    if (hasFolder) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Unable to delete the folder because it contains subfolders.');
    }
    const hasImages = yield image_model_1.Image.findOne({ folder: id });
    if (hasImages) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Unable to delete the folder because it contains images.');
    }
    const result = yield gallery_model_1.GalleryFolder.findByIdAndDelete(id);
    return result;
});
exports.GalleryFolderService = { createGalleryFolderIntoDB, getFoldersFromDB, updateFolderIntoDB, deleteFolderFromDB };
