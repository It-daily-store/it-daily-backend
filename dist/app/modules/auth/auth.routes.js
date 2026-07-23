"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const validateRequest_1 = require("../../middleware/validateRequest");
const auth_validation_1 = require("./auth.validation");
const router = (0, express_1.Router)();
router.post("/customer-register", auth_controller_1.AuthController.registerCustomer);
router.post("/admin-login", auth_controller_1.AuthController.adminLogin);
router.post("/refresh-token", auth_controller_1.AuthController.refreshToken);
router.post("/forgot-password", (0, validateRequest_1.validateRequest)(auth_validation_1.authValidations.forgotPassValidationSchema), auth_controller_1.AuthController.forgotPassword);
router.post("/reset-password", (0, validateRequest_1.validateRequest)(auth_validation_1.authValidations.resetPassValidationSchema), auth_controller_1.AuthController.resetPassword);
router.post("/send-verification", (0, validateRequest_1.validateRequest)(auth_validation_1.authValidations.forgotPassValidationSchema), auth_controller_1.AuthController.SendVerificationEmail);
router.post("/verify-otp", (0, validateRequest_1.validateRequest)(auth_validation_1.authValidations.forgotPassValidationSchema), auth_controller_1.AuthController.verifyEmail);
router.get("/getMyData", (0, auth_1.default)(), auth_controller_1.AuthController.getMyData);
router.post("/updateProfile", (0, auth_1.default)(), auth_controller_1.AuthController.updateMyProfile);
// router.get(
//   "/getMyData/customer",
//   validateAuth(),
//   AuthController.getCustomerData
// );
router.post("/update-password", (0, auth_1.default)(), (0, validateRequest_1.validateRequest)(auth_validation_1.authValidations.updatePassValidationSchema), auth_controller_1.AuthController.updatePassword);
exports.AuthRoutes = router;
