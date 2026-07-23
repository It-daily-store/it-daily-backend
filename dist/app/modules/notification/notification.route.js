"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoutes = void 0;
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const router = (0, express_1.Router)();
router.get('/my-notifications', notification_controller_1.NotificationContoller.getMyNotifications);
exports.notificationRoutes = router;
