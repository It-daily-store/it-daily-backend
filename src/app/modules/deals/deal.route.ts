import { Router } from "express";
import checkPermission from "../../middleware/checkPermission";
import { EAppModules } from "../roles/roles.interface";
import { DealsController } from "./deal.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { DealValidationSchema } from "./deals.validation";

const router = Router();

router.post(
  "/create",
  checkPermission(EAppModules.deals, "can_create_deal"),
  validateRequest(DealValidationSchema.createDealSchema),
  DealsController.createDeal
);

router.put(
  "/add-products/:id",
  checkPermission(EAppModules.deals, "can_manage_deal_products"),
  DealsController.addProductsToDeal
);

router.get(
  "/get-all",
  checkPermission(EAppModules.deals, "can_read_all_deals"),
  DealsController.getAllDeals
);

router.get(
  "/get-by-id/:id",
  checkPermission(EAppModules.deals, "can_read_deal_details"),
  DealsController.getDealById
);
router.get(
  "/get-products/:id",
  checkPermission(EAppModules.deals, "can_read_deal_details"),
  DealsController.getProductsForDeal
);
router.patch(
  "/:id",
  checkPermission(EAppModules.deals, "can_update_deal"),
  DealsController.updateDeal
);

const DealRoutes = router;

export default DealRoutes;
