"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRoutes = void 0;
const express_1 = require("express");
const order_controller_1 = require("./order.controller");
const validateRequest_1 = require("../../middleware/validateRequest");
const order_validation_1 = __importDefault(require("./order.validation"));
const auth_1 = require("../../middleware/auth");
const checkPermission_1 = __importDefault(require("../../middleware/checkPermission"));
const roles_interface_1 = require("../roles/roles.interface");
const router = (0, express_1.Router)();
router.post("/create", (0, validateRequest_1.validateRequest)(order_validation_1.default.createOrderValidationSchema), (0, auth_1.validateCustomer)(), order_controller_1.OrderController.addOrder);
router.get("/my-orders", (0, auth_1.validateCustomer)(), order_controller_1.OrderController.getMyOrders);
router.get("/single/:orderNumber", order_controller_1.OrderController.getOrderByOrderNumber);
router.get("/admin/get-all", (0, checkPermission_1.default)(roles_interface_1.EAppFeatures.orders, "read"), order_controller_1.OrderController.admingetAllOrders);
exports.OrderRoutes = router;
