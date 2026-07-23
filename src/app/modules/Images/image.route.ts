import { Router } from "express";
import upload from "../../lib/image/image.multer";
import { ImageUploadController } from "./image.controller";
import checkPermission from "../../middleware/checkPermission";
import { EAppFeatures } from "../roles/roles.interface";

const router = Router();

router.post(
  "/upload-image",
  checkPermission(EAppFeatures.photo, "create"),
  upload.array("photos", 5),
  ImageUploadController.uploadImage
);

router.get(
  "/get-all",
  checkPermission(EAppFeatures.photo, "read"),
  ImageUploadController.getAllImages
);

router.delete(
  "/delete-images",
  checkPermission(EAppFeatures.photo, "delete"),
  ImageUploadController.deleteImages
);

export const ImageRoutes = router;
