"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const address_controller_1 = require("./address.controller");
const router = (0, express_1.Router)();
router.get("/", (0, auth_1.validateCustomer)(), address_controller_1.AddressController.getMyAddresses);
exports.AddressRoutes = router;
