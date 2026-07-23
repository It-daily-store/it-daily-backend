import { Router } from "express";
import checkPermission from "../../middleware/checkPermission";
import { EAppFeatures } from "../roles/roles.interface";
import { DealsController } from "./deal.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { DealValidationSchema } from "./deals.validation";

const router = Router();

router.post(
  "/create",
  checkPermission(EAppFeatures.deals, "create"),
  validateRequest(DealValidationSchema.createDealSchema),
  DealsController.createDeal
);

router.put(
  "/add-products/:id",
  checkPermission(EAppFeatures.deals, "update"),
  DealsController.addProductsToDeal
);

router.get(
  "/get-all",
  checkPermission(EAppFeatures.deals, "read"),
  DealsController.getAllDeals
);

router.get(
  "/get-by-id/:id",
  checkPermission(EAppFeatures.deals, "read"),
  DealsController.getDealById
);
router.get(
  "/get-products/:id",
  checkPermission(EAppFeatures.deals, "read"),
  DealsController.getProductsForDeal
);
router.patch(
  "/:id",
  checkPermission(EAppFeatures.deals, "update"),
  DealsController.updateDeal
);

const DealRoutes = router;

export default DealRoutes;
