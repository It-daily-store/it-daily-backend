import { Router } from "express";
import checkPermission from "../../middleware/checkPermission";
import { EAppFeatures } from "../roles/roles.interface";
import { FilterControllers } from "./filter.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { filterValidations } from "./filter.validation";

const router = Router();

router.post(
  "/create",
  checkPermission(EAppFeatures.productFilter, "create"),
  validateRequest(filterValidations.createFilterValidationSchema),
  FilterControllers.createFilter
);
router.patch(
  "/update/:id",
  checkPermission(EAppFeatures.productFilter, "update"),
  validateRequest(filterValidations.updateFilterValidationSchema),
  FilterControllers.updateFilter
);
router.get(
  "/get-all",
  checkPermission(EAppFeatures.productFilter, "read"),
  FilterControllers.getAllFilters
);
router.delete(
  "/delete/:id",
  checkPermission(EAppFeatures.productFilter, "delete"),
  FilterControllers.deleteFilter
);

export const FilterRoutes = router;
