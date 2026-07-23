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
exports.ImageUploadServices = void 0;
const mongoose_1 = require("mongoose");
const image_config_1 = __importDefault(require("../../lib/image/image.config"));
const image_model_1 = require("./image.model");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const uploadImageIntoDB = (files, type, folder) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield (0, mongoose_1.startSession)();
    if (!files) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Failed to upload");
    }
    if ((files === null || files === void 0 ? void 0 : files.length) === 0) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Upload some files");
    }
    else {
        files.forEach((file) => {
            if (file.size > 10485760) {
                throw new AppError_1.default(http_status_1.default.CONFLICT, "File size is too large. highest limit is 10 mb");
            }
        });
    }
    try {
        session.startTransaction();
        const uploadImages = files.map((file) => {
            return image_config_1.default.uploader.upload(file.path, function (err, result) {
                if (err) {
                    throw new AppError_1.default(http_status_1.default.CONFLICT, "cloudinary upload failed");
                }
                return result;
            });
        });
        const uploadedImages = yield Promise.all(uploadImages).catch((err) => {
            throw new AppError_1.default(http_status_1.default.CONFLICT, "upload failed");
        });
        if (uploadImages.length === 0) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, "Failed to upload to cloudinary");
        }
        const payloadImages = uploadedImages.map((image) => ({
            extension: image.format,
            height: image.height,
            width: image.width,
            image: image.url,
            name: image.original_filename || "backup",
            size: image.bytes,
            image_type: type,
            public_id: image.public_id,
            folder: folder,
        }));
        const databaseResult = yield image_model_1.Image.create(payloadImages);
        if (!databaseResult) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, "databae upload failed");
        }
        yield session.commitTransaction();
        yield session.endSession();
        return databaseResult;
    }
    catch (err) {
        yield session.abortTransaction();
        yield session.endSession();
        throw new AppError_1.default(http_status_1.default.CONFLICT, err instanceof AppError_1.default ? err === null || err === void 0 ? void 0 : err.message : "upload failed");
    }
});
const getAllImagesFromDB = (parent_id) => __awaiter(void 0, void 0, void 0, function* () {
    const folder = parent_id || null;
    const result = yield image_model_1.Image.find({ folder }).sort({ createdAt: 1 });
    return result;
});
const deleteImagesFromDB = (_a) => __awaiter(void 0, [_a], void 0, function* ({ public_ids, database_ids, }) {
    const session = yield (0, mongoose_1.startSession)();
    try {
        session.startTransaction();
        const deletedFromCloud = yield image_config_1.default.api.delete_resources([...public_ids], {
            type: "upload",
            resource_type: "image",
        });
        if (!deletedFromCloud) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, "Failed to delete from cloud");
        }
        const deleteFromBD = yield image_model_1.Image.deleteMany({
            _id: { $in: [...database_ids] },
        });
        if (!deleteFromBD) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, "Failed to delete from database");
        }
        yield session.commitTransaction();
        yield session.endSession();
        return deleteFromBD;
    }
    catch (err) {
        yield session.abortTransaction();
        yield session.endSession();
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Delete failed");
    }
});
exports.ImageUploadServices = {
    uploadImageIntoDB,
    getAllImagesFromDB,
    deleteImagesFromDB,
};
