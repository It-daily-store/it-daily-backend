import { Router } from "express";
import { validateCustomer } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { AddressController } from "./address.controller";
import { AddressValidations } from "./address.validation";

const router = Router();

router.get("/", validateCustomer(), AddressController.getMyAddresses);

router.post(
  "/create",
  validateCustomer(),
  validateRequest(AddressValidations.createAddressValidationSchema),
  AddressController.createAddress
);

router.patch(
  "/update/:id",
  validateCustomer(),
  validateRequest(AddressValidations.updateAddressValidationSchema),
  AddressController.updateAddress
);

router.patch(
  "/set-default/:id",
  validateCustomer(),
  AddressController.setDefaultAddress
);

router.delete("/delete/:id", validateCustomer(), AddressController.deleteAddress);

export const AddressRoutes = router;
