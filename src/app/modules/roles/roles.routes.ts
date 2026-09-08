import {Router} from "express";
import {RolesController} from "./roles.controller";
import {validateRequest} from "../../middleware/validateRequest";
import {RolesValidations} from "./roles.validation";
import checkPermission from "../../middleware/checkPermission";
import {EAppModules} from "./roles.interface";

const router = Router();

router.post(
  "/create-role",
  validateRequest(RolesValidations.createRoleValidationSchema),
  checkPermission(EAppModules.role, "can_create_role"),
  RolesController.createRole
);

router.get(
  "/permission-catalog",
  checkPermission(EAppModules.role, "can_see_role_page"),
  RolesController.getPermissionCatalog,
);

router.get("/get-all", checkPermission(EAppModules.role, "can_read_all_roles"), RolesController.getAllRoles);

router.patch(
  "/update-role/:id",
  validateRequest(RolesValidations.updateRoleValidationSchema),
  checkPermission(EAppModules.role, "can_update_role"),
  RolesController.updateRole
);

router.delete("/delete-role/:id", checkPermission(EAppModules.role, "can_delete_role"), RolesController.deleteRole);

router.get(
  "/:id",
  checkPermission(EAppModules.role, "can_read_all_roles"),
  RolesController.getSingleRole
);

export const RolesRoutes = router;
