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
exports.ChatServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const chat_model_1 = require("./chat.model");
const createChatIntoDB = (payload, user) => __awaiter(void 0, void 0, void 0, function* () {
    if (!user) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Creator information is missing");
    }
    const result = yield chat_model_1.Chat.create(Object.assign(Object.assign({}, payload), { createdBy: user._id }));
    return result;
});
exports.ChatServices = { createChatIntoDB };
