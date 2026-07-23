"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./app/routes"));
const globalErrorHandler_1 = require("./app/middleware/globalErrorHandler");
const notFound_1 = __importDefault(require("./app/middleware/notFound"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const order_service_1 = require("./app/modules/order/order.service");
const redis_1 = __importDefault(require("./redis"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://192.168.0.103:3000",
        "http://localhost:4000",
        "https://www.admin.gadgetgrid.live",
        "https://admin.gadgetgrid.live",
        "https://gadgetgrid.live",
        "https://www.gadgetgrid.live",
        "https://gadget-grid-admin-v2-fork.vercel.app",
        "https://gadget-grid-homepage-fork.vercel.app",
    ],
    credentials: true,
}));
app.use("/payment/webhook", express_1.default.raw({ type: "application/json" }), order_service_1.paymentWebhook);
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use("/api/v1", routes_1.default);
app.get("/ping", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pong = yield redis_1.default.ping();
    res.json({
        message: "Hello Docker! update from docker image. test after deleting files",
        redis: pong,
    });
}));
app.use(globalErrorHandler_1.globalErrorHandler);
app.use(notFound_1.default);
exports.default = app;
