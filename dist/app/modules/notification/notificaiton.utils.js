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
exports.addNotifications = exports.buildNotifications = void 0;
const socket_1 = require("../../../socket");
const makeFullName_1 = require("../../utils/makeFullName");
const user_model_1 = require("../user/user.model");
const notification_model_1 = __importDefault(require("./notification.model"));
const buildNotifications = (_a) => __awaiter(void 0, [_a], void 0, function* ({ thisUser, source, notificationType, actionType, text, }) {
    const admins = yield user_model_1.User.findAllVerifiedAdmins();
    const notifications = admins.map((admin) => {
        const notification = {
            notificationType: notificationType,
            actionType: actionType,
            opened: false,
            userFrom: thisUser === null || thisUser === void 0 ? void 0 : thisUser._id,
            userTo: admin === null || admin === void 0 ? void 0 : admin._id,
            source: String(source),
            text: `${String(admin._id) === String(thisUser === null || thisUser === void 0 ? void 0 : thisUser._id)
                ? "You"
                : (0, makeFullName_1.makeFullName)(thisUser.name)} ${text}`,
        };
        return notification;
    });
    return notifications;
});
exports.buildNotifications = buildNotifications;
const addNotifications = (_a) => __awaiter(void 0, [_a], void 0, function* ({ notifications, rooms, ignoreRooms, userFrom, }) {
    const io = (0, socket_1.getIO)();
    if (notifications && notifications.length > 0) {
        for (const noti of notifications) {
            try {
                const res = (yield notification_model_1.default.create(noti)).toObject();
                console.log(noti.userTo);
                io.to(`${noti === null || noti === void 0 ? void 0 : noti.userTo.toString()}`).emit("newNotification", Object.assign(Object.assign({}, res), { userFrom: userFrom }));
            }
            catch (err) {
                console.log(err);
            }
        }
    }
});
exports.addNotifications = addNotifications;
