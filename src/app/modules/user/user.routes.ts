import { Router } from "express";
import { UserController } from "./user.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { UserValidations } from "./user.validation";
import checkPermission from "../../middleware/checkPermission";
import { EAppModules } from "../roles/roles.interface";

const router = Router();

router.post(
  "/create-admin",
  validateRequest(UserValidations.createUserValidationSchema),
  checkPermission(EAppModules.user, "can_create_admin"),
  UserController.createUser
);

router.get(
  "/admin/get-all",
  checkPermission(EAppModules.user, "can_read_all_users"),
  UserController.getAllUsers
);

router.delete(
  "/:userId",
  checkPermission(EAppModules.user, "can_delete_user"),
  UserController.deleteUser
);

router.get(
  "/:id",
  checkPermission(EAppModules.user, "can_read_user_details"),
  UserController.getSingleUser
);

export const UserRoutes = router;
