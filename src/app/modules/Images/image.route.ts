import { Router } from "express";
import upload from "../../lib/image/image.multer";
import { ImageUploadController } from "./image.controller";
import checkPermission from "../../middleware/checkPermission";
import { EAppModules } from "../roles/roles.interface";

const router = Router();

router.post(
  "/upload-image",
  checkPermission(EAppModules.photo, "can_upload_photo"),
  upload.array("photos", 5),
  ImageUploadController.uploadImage
);

router.get(
  "/get-all",
  checkPermission(EAppModules.photo, "can_read_all_photos"),
  ImageUploadController.getAllImages
);

router.delete(
  "/delete-images",
  checkPermission(EAppModules.photo, "can_delete_photo"),
  ImageUploadController.deleteImages
);

export const ImageRoutes = router;
