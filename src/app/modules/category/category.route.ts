import { Router } from "express";
import { CategoryControllers } from "./category.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { CategoryValidations } from "./category.validation";
import checkPermission from "../../middleware/checkPermission";
import { EAppModules } from "../roles/roles.interface";

const router = Router();

router.post(
  "/create",
  checkPermission(EAppModules.category, "can_create_category"),
  validateRequest(CategoryValidations.createCategoryValidationSchema),
  CategoryControllers.createCategory
);

router.get("/get-all", CategoryControllers.getAllCategories);

router.get(
  "/single/:id",
  checkPermission(EAppModules.category, "can_read_category_details"),
  CategoryControllers.getSingleCategories
);

router.delete(
  "/:id",
  checkPermission(EAppModules.category, "can_delete_category"),
  CategoryControllers.deleteCategory
);

router.patch(
  "/:id",
  checkPermission(EAppModules.category, "can_update_category"),
  validateRequest(CategoryValidations.updateCategoryValidationSchema),
  CategoryControllers.updateCategory
);

export const CategoryRoutes = router;
