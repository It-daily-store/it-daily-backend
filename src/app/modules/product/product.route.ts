import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { ProductValidations } from "./product.validations";
import { ProductControllers } from "./product.controller";
import checkPermission from "../../middleware/checkPermission";
import { EAppFeatures } from "../roles/roles.interface";
import upload from "../../lib/image/image.multer";

const router = Router();

router.post(
  "/create-product",
  validateRequest(ProductValidations.createProductValidationSchema),
  checkPermission(EAppFeatures.product, "create"),
  ProductControllers.createProduct
);

router.get("/get-all", ProductControllers.getAllProduct);

router.post(
  "/bulk-upload",
  checkPermission(EAppFeatures.product, "create"),
  upload.single("bulkFile"),
  ProductControllers.bulkUpload
);

router.post(
  "/bulk-upload-json",
  checkPermission(EAppFeatures.product, "create"),
  upload.single("bulkFile"),
  ProductControllers.jsonBulkUpload
);

router.get(
  "/single/:id",
  checkPermission(EAppFeatures.product, "read"),
  ProductControllers.getSingleProduct
);
router.get(
  "/json-template",
  checkPermission(EAppFeatures.product, "read"),
  ProductControllers.downloadJsonTemplate
);

router.patch(
  "/update-product/:id",
  checkPermission(EAppFeatures.product, "update"),
  ProductControllers.updateProduct
);

export const productRoutes = router;
