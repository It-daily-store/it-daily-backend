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
exports.NotificationService = void 0;
const queryBuilder_1 = __importDefault(require("../../builder/queryBuilder"));
const notification_model_1 = __importDefault(require("./notification.model"));
const mongodb_1 = require("mongodb");
const addNotificationToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_model_1.default.create(payload);
    return result;
});
const getMyNotificationsFromDB = (user, query) => __awaiter(void 0, void 0, void 0, function* () {
    const unreadCount = yield notification_model_1.default.countDocuments({
        userTo: new mongodb_1.ObjectId(user),
        opened: false,
    });
    const total = yield notification_model_1.default.countDocuments({
        userTo: new mongodb_1.ObjectId(user),
    });
    const newQuery = {
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 20,
    };
    const notificationQuery = new queryBuilder_1.default(notification_model_1.default.find({ userTo: new mongodb_1.ObjectId(user) }), newQuery).sort();
    yield notificationQuery.paginate();
    const result = yield notificationQuery.modelQuery.populate([
        {
            path: "userTo",
            select: "name fullName role email profilePicture",
            // populate: [
            //   {
            //     path: "role",
            //     select: "role",
            //   },
            // ],
        },
        {
            path: "userFrom",
            select: "name fullName role email profilePicture",
            // populate: [
            //   {
            //     path: "role",
            //     select: "role",
            //   },
            // ],
        },
    ]);
    const pagination = {
        currentPage: newQuery.page,
        limit: newQuery.limit,
        hasMore: result.length === newQuery.limit,
        total,
    };
    return {
        data: {
            notifications: result,
            unreadCount,
        },
        pagination,
    };
});
exports.NotificationService = {
    addNotificationToDB,
    getMyNotificationsFromDB,
};
