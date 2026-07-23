"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productDetailsCategory_route_1 = require("../modules/productDetailsCategory/productDetailsCategory.route");
const category_route_1 = require("../modules/category/category.route");
const product_route_1 = require("../modules/product/product.route");
const image_route_1 = require("../modules/Images/image.route");
const gallery_route_1 = require("../modules/gallery/gallery.route");
const user_routes_1 = require("../modules/user/user.routes");
const roles_routes_1 = require("../modules/roles/roles.routes");
const auth_routes_1 = require("../modules/auth/auth.routes");
const auth_1 = __importDefault(require("../middleware/auth"));
const brand_route_1 = require("../modules/brand/brand.route");
const bulkUpload_route_1 = require("../modules/bulkUpload/bulkUpload.route");
const filter_routes_1 = require("../modules/productFilters/filter.routes");
const notification_route_1 = require("../modules/notification/notification.route");
const chat_route_1 = require("../modules/chat/chat.route");
const customerRoute_1 = require("../modules/customer/customerRoute");
const order_route_1 = require("../modules/order/order.route");
const address_route_1 = require("../modules/address/address.route");
const deal_route_1 = __importDefault(require("../modules/deals/deal.route"));
const settings_route_1 = __importDefault(require("../modules/settings/settings.route"));
const router = (0, express_1.Router)();
const moduleRoutes = [
    { path: "/product-details-category", route: productDetailsCategory_route_1.ProductDetailsCategoryRoutes },
    { path: "/category", route: category_route_1.CategoryRoutes },
    {
        path: "/product",
        route: product_route_1.productRoutes,
    },
    { path: "/upload", route: image_route_1.ImageRoutes },
    { path: "/gallery", route: gallery_route_1.galleryRoutes },
    { path: "/user", route: user_routes_1.UserRoutes },
    { path: "/roles", route: roles_routes_1.RolesRoutes },
    { path: "/auth", route: auth_routes_1.AuthRoutes },
    { path: "/chat", route: chat_route_1.chatRoutes },
    { path: "/brand", route: brand_route_1.BrandRoutes },
    { path: "/upload-history", route: bulkUpload_route_1.bulkUploadRoutes },
    { path: "/product-filters", route: filter_routes_1.FilterRoutes },
    { path: "/notification", route: notification_route_1.notificationRoutes },
    { path: "/customer", route: customerRoute_1.CustomerRoutes },
    { path: "/order", route: order_route_1.OrderRoutes },
    { path: "/address", route: address_route_1.AddressRoutes },
    { path: "/deal", route: deal_route_1.default },
    { path: "/settings", route: settings_route_1.default },
];
moduleRoutes.forEach((route) => {
    if (route.path === "/auth" || route.path === "/customer") {
        router.use(route.path, route.route);
    }
    else {
        router.use(route.path, (0, auth_1.default)(), route.route);
    }
});
exports.default = router;
