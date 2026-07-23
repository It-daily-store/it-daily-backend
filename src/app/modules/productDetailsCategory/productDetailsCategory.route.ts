import { Router } from "express";
import { ProductDetailsCategoryControllers } from "./productDetailsCategory.controller";
import { ProductDetailsCategoryValidations } from "./productDetailsCategory.validation";
import { validateRequest } from "../../middleware/validateRequest";
import checkPermission from "../../middleware/checkPermission";
import { EAppFeatures } from "../roles/roles.interface";

const router = Router();

router.post(
  "/create",
  validateRequest(
    ProductDetailsCategoryValidations.createProductDetailsCategoryValidationSchema
  ),
  checkPermission(EAppFeatures.productDetails, "create"),
  ProductDetailsCategoryControllers.createProductDetailsCategory
);

router.patch(
  "/update/:id",
  validateRequest(
    ProductDetailsCategoryValidations.updateProductDetailsCategoryValidationSchema
  ),
  checkPermission(EAppFeatures.productDetails, "update"),
  ProductDetailsCategoryControllers.updateProductDetailsCategory
);

router.get(
  "/single/:id",
  ProductDetailsCategoryControllers.getSingleProductDetailsCategory
);

router.get(
  "/get-all",
  ProductDetailsCategoryControllers.getAllProductDetailsCategory
);

router.delete(
  "/delete/:id",
  checkPermission(EAppFeatures.productDetails, "delete"),
  ProductDetailsCategoryControllers.deleteProductDetailsCategory
);

export const ProductDetailsCategoryRoutes = router;
