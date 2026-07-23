import { Router } from "express";
import checkPermission from "../../middleware/checkPermission";
import { EAppFeatures } from "../roles/roles.interface";
import { BrandController } from "./brand.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { BrandValidationSchema } from "./brand.validation";

const router = Router()

router.post('/create', checkPermission(EAppFeatures.brand, 'create'), validateRequest(BrandValidationSchema.createBrandValidationSchema), BrandController.createBrand)

router.patch('/update/:id', checkPermission(EAppFeatures.brand, 'update'), validateRequest(BrandValidationSchema.updateBrandValidationSchema), BrandController.updateBrand)

router.get('/get-all', checkPermission(EAppFeatures.brand, 'read'), BrandController.getAllBrands)

router.delete('/delete/:id', checkPermission(EAppFeatures.brand, 'delete'), BrandController.deleteBrand)

export const BrandRoutes = router