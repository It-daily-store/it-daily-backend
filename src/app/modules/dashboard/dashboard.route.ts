import { Router } from "express";
import { DashboardController } from "./dashboard.controller";

const router = Router();

router.get("/", DashboardController.getDashboardAnalytics);

const dashboardRoutes = router;

export default dashboardRoutes;
