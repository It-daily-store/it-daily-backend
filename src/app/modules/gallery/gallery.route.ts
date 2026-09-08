import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { GalleryFolderValidatonSchema } from "./gallery.validation";
import { GalleryFolderController } from "./gallery.controller";
import checkPermission from "../../middleware/checkPermission";
import { EAppModules } from "../roles/roles.interface";

const router = Router()

router.post('/create-folder', validateRequest(GalleryFolderValidatonSchema.createGalleryFolderValidationSchema), checkPermission(EAppModules.gallery, 'can_create_folder'), GalleryFolderController.createGalleryFolder)
router.get('/get-folders', checkPermission(EAppModules.gallery, 'can_read_all_folders'), GalleryFolderController.getFolders)
router.patch('/update-folder/:id', checkPermission(EAppModules.gallery, 'can_update_folder'), GalleryFolderController.updateFolder)
router.delete('/delete/:id', checkPermission(EAppModules.gallery, 'can_delete_folder'), GalleryFolderController.deleteFolder)



export const galleryRoutes = router