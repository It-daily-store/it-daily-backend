import { Router } from "express";
import checkPermission from "../../middleware/checkPermission";
import { EAppModules } from "../roles/roles.interface";
import { FilterControllers } from "./filter.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { filterValidations } from "./filter.validation";

const router = Router();

router.post(
  "/create",
  checkPermission(EAppModules.productFilter, "can_create_filter"),
  validateRequest(filterValidations.createFilterValidationSchema),
  FilterControllers.createFilter
);
router.patch(
  "/update/:id",
  checkPermission(EAppModules.productFilter, "can_update_filter"),
  validateRequest(filterValidations.updateFilterValidationSchema),
  FilterControllers.updateFilter
);
router.get(
  "/get-all",
  checkPermission(EAppModules.productFilter, "can_read_all_filters"),
  FilterControllers.getAllFilters
);
router.delete(
  "/delete/:id",
  checkPermission(EAppModules.productFilter, "can_delete_filter"),
  FilterControllers.deleteFilter
);

export const FilterRoutes = router;
