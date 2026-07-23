import { Router } from "express";
import { BannerController } from "./banner.controller";

const router = Router();

router.get("/get-banner", BannerController.getBanner);

export const BannerRoutes = router;
