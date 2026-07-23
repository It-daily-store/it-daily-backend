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
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./app/config"));
const socket_1 = require("./socket");
const notification_model_1 = __importDefault(require("./app/modules/notification/notification.model"));
const socketAuth_1 = require("./app/middleware/socketAuth");
const product_queue_1 = require("./app/modules/product/product.queue");
const deal_queue_1 = require("./app/modules/deals/deal.queue");
let server;
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(config_1.default.database_url);
        yield product_queue_1.productQueue.add(product_queue_1.ProductJobName.updateAllProducts, {});
        yield deal_queue_1.dealQueue.add(deal_queue_1.DealJobName.updateAllDeals, {});
        server = app_1.default.listen(config_1.default.port, () => {
            console.log(`IT shop server running on port ${config_1.default.port}`);
        });
        const io = (0, socket_1.initializeSocketIO)(server);
        io === null || io === void 0 ? void 0 : io.use(socketAuth_1.ValidateIOAuth);
        io === null || io === void 0 ? void 0 : io.on("connection", (socket) => {
            socket.on("adminJoin", (data) => {
                console.log(`admin joined ${data.user}`);
                socket.join(`${data.user}`);
                socket.join("admins");
            });
            socket.on("notificationClicked", (id) => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b;
                const user = (_b = (_a = socket.user) === null || _a === void 0 ? void 0 : _a.userData) === null || _b === void 0 ? void 0 : _b._id;
                console.log(user);
                try {
                    const res = yield notification_model_1.default.findByIdAndUpdate(id, {
                        opened: true,
                    });
                    io.to(`${String(user)}`).emit("notificationRead", res);
                }
                catch (err) {
                    console.log(err);
                }
            }));
            socket.on("markAllRead", () => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b;
                const user = (_b = (_a = socket.user) === null || _a === void 0 ? void 0 : _a.userData) === null || _b === void 0 ? void 0 : _b._id;
                const updateAll = yield notification_model_1.default.updateMany({ userTo: user }, { opened: true });
                if (updateAll) {
                    io.to(`${String(user)}`).emit("markedAllasRead");
                }
            }));
        });
    }
    catch (err) {
        console.log("Something went wrong", err);
    }
});
main();
process.on("uncaughtException", () => {
    console.log("UncaughtException error, shutting the server...");
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
});
process.on("unhandledRejection", () => {
    console.log(" unhandledRejection error, shutting the server...");
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
});
