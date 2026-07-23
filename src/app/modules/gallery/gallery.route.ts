import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { GalleryFolderValidatonSchema } from "./gallery.validation";
import { GalleryFolderController } from "./gallery.controller";
import checkPermission from "../../middleware/checkPermission";
import { EAppFeatures } from "../roles/roles.interface";

const router = Router()

router.post('/create-folder', validateRequest(GalleryFolderValidatonSchema.createGalleryFolderValidationSchema), checkPermission(EAppFeatures.gallery, 'create'), GalleryFolderController.createGalleryFolder)
router.get('/get-folders', checkPermission(EAppFeatures.gallery, 'read'), GalleryFolderController.getFolders)
router.patch('/update-folder/:id', checkPermission(EAppFeatures.gallery, 'update'), GalleryFolderController.updateFolder)
router.delete('/delete/:id', checkPermission(EAppFeatures.gallery, 'delete'), GalleryFolderController.deleteFolder)



export const galleryRoutes = router