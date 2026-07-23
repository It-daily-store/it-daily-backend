"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BannerRoutes = void 0;
const express_1 = require("express");
const banner_controller_1 = require("./banner.controller");
const router = (0, express_1.Router)();
router.get("/get-banner", banner_controller_1.BannerController.getBanner);
exports.BannerRoutes = router;
