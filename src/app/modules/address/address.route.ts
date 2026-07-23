import { Router } from "express";
import { validateCustomer } from "../../middleware/auth";
import { AddressController } from "./address.controller";

const router = Router();

router.get("/", validateCustomer(), AddressController.getMyAddresses);

export const AddressRoutes = router;
