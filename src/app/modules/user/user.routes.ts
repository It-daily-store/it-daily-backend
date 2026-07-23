import { Router } from "express";
import { UserController } from "./user.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { UserValidations } from "./user.validation";
import checkPermission from "../../middleware/checkPermission";
import { EAppFeatures } from "../roles/roles.interface";

const router = Router();

router.post(
  "/create-admin",
  validateRequest(UserValidations.createUserValidationSchema),
  checkPermission(EAppFeatures.user, "create"),
  UserController.createUser
);

router.get(
  "/admin/get-all",
  checkPermission(EAppFeatures.user, "read"),
  UserController.getAllUsers
);

router.delete(
  "/:userId",
  checkPermission(EAppFeatures.user, "delete"),
  UserController.deleteUser
);

router.get(
  "/:id",
  checkPermission(EAppFeatures.user, "read"),
  UserController.getSingleUser
);

export const UserRoutes = router;
