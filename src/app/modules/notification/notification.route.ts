import { Router } from "express";
import { NotificationContoller } from "./notification.controller";

const router = Router()

router.get('/my-notifications', NotificationContoller.getMyNotifications)

export const notificationRoutes = router