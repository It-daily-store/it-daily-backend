import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { ProductValidations } from "./product.validations";
import { ProductControllers } from "./product.controller";
import checkPermission from "../../middleware/checkPermission";
import { EAppModules } from "../roles/roles.interface";
import upload from "../../lib/image/image.multer";

const router = Router();

router.post(
  "/create-product",
  validateRequest(ProductValidations.createProductValidationSchema),
  checkPermission(EAppModules.product, "can_create_product"),
  ProductControllers.createProduct
);

router.get(
  "/get-all",
  checkPermission(EAppModules.product, "can_read_all_products"),
  ProductControllers.getAllProduct,
);

router.post(
  "/bulk-upload",
  checkPermission(EAppModules.product, "can_bulk_upload_products"),
  upload.single("bulkFile"),
  ProductControllers.bulkUpload
);

router.post(
  "/bulk-upload-json",
  checkPermission(EAppModules.product, "can_bulk_upload_products"),
  upload.single("bulkFile"),
  ProductControllers.jsonBulkUpload
);

router.get(
  "/single/:id",
  checkPermission(EAppModules.product, "can_read_product_details"),
  ProductControllers.getSingleProduct
);
router.get(
  "/json-template",
  checkPermission(EAppModules.product, "can_download_product_template"),
  ProductControllers.downloadJsonTemplate
);

router.patch(
  "/update-product/:id",
  checkPermission(EAppModules.product, "can_update_product"),
  ProductControllers.updateProduct
);

export const productRoutes = router;
