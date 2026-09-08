import { Router } from "express";
import checkPermission from "../../middleware/checkPermission";
import { EAppModules } from "../roles/roles.interface";
import { BulkUploadHistoryController } from "./bulkUpload.controller";

const router = Router()

router.get('/get-all', checkPermission(EAppModules.bulkUpload, 'can_read_bulk_upload_history'), BulkUploadHistoryController.getBulkUploadHistory)

export const bulkUploadRoutes = router