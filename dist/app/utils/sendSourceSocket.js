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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSourceSocket = void 0;
const socket_1 = require("../../socket");
const user_model_1 = require("../modules/user/user.model");
const sendSourceSocket = (_a) => __awaiter(void 0, [_a], void 0, function* ({ payload, ignore, event, }) {
    const exceptRooms = ignore !== null && ignore !== void 0 ? ignore : "";
    const admins = yield user_model_1.User.findAllVerifiedAdmins();
    const io = (0, socket_1.getIO)();
    for (const admin of admins) {
        io.to(`${String(admin === null || admin === void 0 ? void 0 : admin._id)}`)
            .except([...exceptRooms])
            .emit(event, payload);
    }
});
exports.sendSourceSocket = sendSourceSocket;
