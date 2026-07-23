import { Router } from "express";
import { OrderController } from "./order.controller";
import { validateRequest } from "../../middleware/validateRequest";
import orderValidations from "./order.validation";
import { validateCustomer } from "../../middleware/auth";
import checkPermission from "../../middleware/checkPermission";
import { EAppFeatures } from "../roles/roles.interface";

const router = Router();

router.post(
  "/create",
  validateRequest(orderValidations.createOrderValidationSchema),
  validateCustomer(),
  OrderController.addOrder
);

router.get("/my-orders", validateCustomer(), OrderController.getMyOrders);
router.get("/single/:orderNumber", OrderController.getOrderByOrderNumber);

router.patch(
  "/admin/update/:id",
  checkPermission(EAppFeatures.orders, "update"),
  validateRequest(orderValidations.AdminUpdateOrderSchema),
  OrderController.adminUpdateOrder
);

router.get(
  "/admin/get-all",
  checkPermission(EAppFeatures.orders, "read"),
  OrderController.admingetAllOrders
);

export const OrderRoutes = router;
