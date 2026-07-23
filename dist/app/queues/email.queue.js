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
exports.emailQueue = exports.EmailJobName = void 0;
const bullmq_1 = require("bullmq");
const common_1 = require("../interface/common");
const sendEmail_1 = require("../utils/sendEmail");
const generateOrderEmailHTML_1 = require("../templates/generateOrderEmailHTML");
const generateVerifyEmailHtml_1 = require("../templates/generateVerifyEmailHtml");
const generateResetPassHtml_1 = require("../templates/generateResetPassHtml");
var EmailJobName;
(function (EmailJobName) {
    EmailJobName["sendVerificationEmail"] = "sendVerificationEmail";
    EmailJobName["sendResetPasswordEmail"] = "sendResetPasswordEmail";
    EmailJobName["sendOrderConfirmationEmail"] = "sendOrderConfirmationEmail";
    EmailJobName["sendPaymentConfirmationEmail"] = "sendPaymentConfirmationEmail";
})(EmailJobName || (exports.EmailJobName = EmailJobName = {}));
const redisConnection = {
    connection: {
        url: process.env.REDIS_URL,
    },
};
exports.emailQueue = new bullmq_1.Queue(common_1.RedisKeys.email, redisConnection);
const emailWorker = new bullmq_1.Worker(common_1.RedisKeys.email, (job) => __awaiter(void 0, void 0, void 0, function* () {
    if (job.name === EmailJobName.sendVerificationEmail) {
        try {
            const { opt, user } = job.data;
            const mailBody = (0, generateVerifyEmailHtml_1.generateVerifyEmailHtml)(opt, user === null || user === void 0 ? void 0 : user.name);
            yield (0, sendEmail_1.sendEmail)(user.email, mailBody, "Verify your email");
        }
        catch (err) {
            console.log(err);
        }
    }
    if (job.name === EmailJobName.sendResetPasswordEmail) {
        const { opt, user } = job.data;
        try {
            const mailBody = (0, generateResetPassHtml_1.generateResetPassHtml)(opt, user === null || user === void 0 ? void 0 : user.name);
            yield (0, sendEmail_1.sendEmail)(user.email, mailBody, "Reset your password");
        }
        catch (err) {
            console.log(err);
        }
    }
    if (job.name === EmailJobName.sendOrderConfirmationEmail) {
        const { order, user } = job.data;
        try {
            const subject = `Order Confirmation #${order.orderNumber}`;
            const html = (0, generateOrderEmailHTML_1.generateOrderEmailHTML)(order);
            return (0, sendEmail_1.sendEmail)(user.email, html, subject);
        }
        catch (err) {
            console.log(err);
        }
    }
    if (job.name === EmailJobName.sendOrderConfirmationEmail) {
        const { order, user } = job.data;
        try {
            const subject = `Order Confirmation #${order.orderNumber}`;
            const html = (0, generateOrderEmailHTML_1.generateOrderEmailHTML)(order);
            return (0, sendEmail_1.sendEmail)(user.email, html, subject);
        }
        catch (err) {
            console.log(err);
        }
    }
    if (job.name === EmailJobName.sendPaymentConfirmationEmail) {
        const { order, user } = job.data;
        try {
            const subject = `Order Confirmation #${order.orderNumber}`;
            const html = (0, generateOrderEmailHTML_1.generateOrderEmailHTML)(order);
            return (0, sendEmail_1.sendEmail)(user.email, html, subject);
        }
        catch (err) {
            console.log(err);
        }
    }
}), redisConnection);
emailWorker.on("completed", (job) => {
    console.log(`Deal Job ${job.id} completed!`);
});
emailWorker.on("failed", (job, err) => {
    console.log(`Deal Job ${job === null || job === void 0 ? void 0 : job.id} failed: ${err.message}`);
});
