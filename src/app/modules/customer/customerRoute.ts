import { Router } from "express";
import { customerController } from "./customerController";
import { ProductControllers } from "../product/product.controller";
import { AuthController } from "../auth/auth.controller";
import { SettingsController } from "../settings/settings.controller";
import { BannerTemplateController } from "../banner/banner.controller";
import { BrandController } from "../brand/brand.controller";

const router = Router();

router.get("/category/get-all", customerController.getCategories);
router.get("/category/single/:slug", customerController.getCategoryDataBySlug);
router.get("/category/static-slugs", customerController.getStaticCategorySlugs);
router.get("/category/get-featured", customerController.getFeaturedCategories);
router.get("/product/get-featured", ProductControllers.getFeaturedProducts);
router.get("/product/new-arrivals", ProductControllers.getNewArrivals);
router.get("/product/best-sellers", ProductControllers.getBestSellers);
router.get("/product/by-brand/:brandId", ProductControllers.getProductsByBrand);
router.get("/brand/get-all", BrandController.getStorefrontBrands);
router.get(
  "/product/by-category/:slug",
  ProductControllers.getProductsByCategory,
);
router.get(
  "/filters/by-category/:slug",
  ProductControllers.getFiltersByCategory,
);
router.get(
  "/product/get-single/:slug",
  ProductControllers.getSingleProductBySlug,
);

router.get("/data-for-sitemap", customerController.getDataForSitemap);

router.get("/product/search", ProductControllers.getSearchProducts);
router.get("/product/static-slugs", ProductControllers.getStaticProductSlugs);
router.get("/product/compare", ProductControllers.getCompareProducts);
router.get("/product/pc-builder/:id", ProductControllers.getPcBuilderProducts);

// =============== auth ================
router.post("/login", AuthController.userLogin);

// ==== pc builder ====
router.get("/settings/pc-builder", SettingsController.getPcBuilder);

// ==== banner ====
// The storefront hero banner. Reads whichever template an admin marked
// active; responds 200 with `data: null` when none is.
router.get("/banner/active", BannerTemplateController.getActiveTemplate);

export const CustomerRoutes = router;
