import { Router } from "express";
import { ProductDetailsCategoryControllers } from "./productDetailsCategory.controller";
import { ProductDetailsCategoryValidations } from "./productDetailsCategory.validation";
import { validateRequest } from "../../middleware/validateRequest";
import checkPermission from "../../middleware/checkPermission";
import { EAppModules } from "../roles/roles.interface";

const router = Router();

router.post(
  "/create",
  validateRequest(
    ProductDetailsCategoryValidations.createProductDetailsCategoryValidationSchema
  ),
  checkPermission(EAppModules.productDetails, "can_create_details_category"),
  ProductDetailsCategoryControllers.createProductDetailsCategory
);

router.patch(
  "/update/:id",
  validateRequest(
    ProductDetailsCategoryValidations.updateProductDetailsCategoryValidationSchema
  ),
  checkPermission(EAppModules.productDetails, "can_update_details_category"),
  ProductDetailsCategoryControllers.updateProductDetailsCategory
);

router.get(
  "/single/:id",
  checkPermission(EAppModules.productDetails, "can_read_all_details_categories"),
  ProductDetailsCategoryControllers.getSingleProductDetailsCategory
);

router.get(
  "/get-all",
  checkPermission(EAppModules.productDetails, "can_read_all_details_categories"),
  ProductDetailsCategoryControllers.getAllProductDetailsCategory
);

router.delete(
  "/delete/:id",
  checkPermission(EAppModules.productDetails, "can_delete_details_category"),
  ProductDetailsCategoryControllers.deleteProductDetailsCategory
);

export const ProductDetailsCategoryRoutes = router;
