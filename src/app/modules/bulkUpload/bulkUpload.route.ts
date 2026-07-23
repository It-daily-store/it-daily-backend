import { Router } from "express";
import validateAuth from "../../middleware/auth";
import checkPermission from "../../middleware/checkPermission";
import { EAppFeatures } from "../roles/roles.interface";
import { BulkUploadHistoryController } from "./bulkUpload.controller";

const router = Router()

router.get('/get-all', checkPermission(EAppFeatures.bulkUpload, 'read'), BulkUploadHistoryController.getBulkUploadHistory)

export const bulkUploadRoutes = router