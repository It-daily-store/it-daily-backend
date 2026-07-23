"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRoutes = void 0;
const express_1 = require("express");
const customerController_1 = require("./customerController");
const banner_controller_1 = require("../banner/banner.controller");
const product_controller_1 = require("../product/product.controller");
const auth_controller_1 = require("../auth/auth.controller");
const settings_controller_1 = require("../settings/settings.controller");
const router = (0, express_1.Router)();
router.get("/category/get-all", customerController_1.customerController.getCategories);
router.get("/category/static-slugs", customerController_1.customerController.getStaticCategorySlugs);
router.get("/category/get-featured", customerController_1.customerController.getFeaturedCategories);
router.get("/banner/get-banner/:id", banner_controller_1.BannerController.getBanner);
router.get("/product/get-featured", product_controller_1.ProductControllers.getFeaturedProducts);
router.get("/product/by-category/:slug", product_controller_1.ProductControllers.getProductsByCategory);
router.get("/product/get-single/:slug", product_controller_1.ProductControllers.getSingleProductBySlug);
router.get("/data-for-sitemap", customerController_1.customerController.getDataForSitemap);
router.get("/product/search", product_controller_1.ProductControllers.getSearchProducts);
router.get("/product/static-slugs", product_controller_1.ProductControllers.getStaticProductSlugs);
router.get("/product/compare", product_controller_1.ProductControllers.getCompareProducts);
router.get("/product/pc-builder/:id", product_controller_1.ProductControllers.getPcBuilderProducts);
// =============== auth ================
router.post("/login", auth_controller_1.AuthController.userLogin);
// ==== pc builder ====
router.get("/settings/pc-builder", settings_controller_1.SettingsController.getPcBuilder);
exports.CustomerRoutes = router;
