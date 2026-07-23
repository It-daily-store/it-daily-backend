import {Router} from "express";
import {RolesController} from "./roles.controller";
import {validateRequest} from "../../middleware/validateRequest";
import {RolesValidations} from "./roles.validation";
import checkPermission from "../../middleware/checkPermission";
import {EAppFeatures} from "./roles.interface";

const router = Router();

router.post(
  "/create-role",
  validateRequest(RolesValidations.createRoleValidationSchema),
  checkPermission(EAppFeatures.role, "create"),
  RolesController.createRole
);

router.get("/get-all", checkPermission(EAppFeatures.role, "read"), RolesController.getAllRoles);

router.patch("/update-role/:id", checkPermission(EAppFeatures.role, "update"), RolesController.updateRole);

router.delete("/delete-role/:id", checkPermission(EAppFeatures.role, "delete"), RolesController.deleteRole);

export const RolesRoutes = router;
