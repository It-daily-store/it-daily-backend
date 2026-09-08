import { Router } from "express";
import checkPermission from "../../middleware/checkPermission";
import { EAppModules } from "../roles/roles.interface";
import { BrandController } from "./brand.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { BrandValidationSchema } from "./brand.validation";

const router = Router()

router.post('/create', checkPermission(EAppModules.brand, 'can_create_brand'), validateRequest(BrandValidationSchema.createBrandValidationSchema), BrandController.createBrand)

router.patch('/update/:id', checkPermission(EAppModules.brand, 'can_update_brand'), validateRequest(BrandValidationSchema.updateBrandValidationSchema), BrandController.updateBrand)

router.get('/get-all', checkPermission(EAppModules.brand, 'can_read_all_brands'), BrandController.getAllBrands)

router.delete('/delete/:id', checkPermission(EAppModules.brand, 'can_delete_brand'), BrandController.deleteBrand)

export const BrandRoutes = router