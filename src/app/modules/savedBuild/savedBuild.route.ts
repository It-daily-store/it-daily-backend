import { Router } from "express";
import { validateCustomer } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { SavedBuildController } from "./savedBuild.controller";
import { SavedBuildValidations } from "./savedBuild.validation";

const router = Router();

router.get("/my-builds", validateCustomer(), SavedBuildController.getMyBuilds);

router.get("/single/:id", validateCustomer(), SavedBuildController.getSingleBuild);

router.post(
  "/create",
  validateCustomer(),
  validateRequest(SavedBuildValidations.createSavedBuildValidationSchema),
  SavedBuildController.createBuild
);

router.patch(
  "/update/:id",
  validateCustomer(),
  validateRequest(SavedBuildValidations.updateSavedBuildValidationSchema),
  SavedBuildController.updateBuild
);

router.delete("/delete/:id", validateCustomer(), SavedBuildController.deleteBuild);

export const SavedBuildRoutes = router;
