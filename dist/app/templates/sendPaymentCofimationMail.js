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
const sendEmail_1 = require("../utils/sendEmail");
const generatePaymentConfirmationEmailHTML = (order, user) => {
    var _a, _b, _c, _d, _e;
    const company = {
        logo: "",
        email: "gadgetGrid@gmail.com",
        name: "Gadget Grid",
        phone: "088+023342-24-24",
    };
    // Sample data based on your image and schema
    const paymentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Dhaka", // Adjust for +06 timezone
    });
    const shippingAddress = order.shippingAddress; // Placeholder from image
    const itemsHTML = order.items
        .map((item) => {
        var _a, _b;
        return `
        <tr style="border-bottom: 1px solid #e0e0e0;">
            <td style="padding: 10px; vertical-align: middle;">
                <img src="${item.image || "https://via.placeholder.com/50"}" alt="${item.name || "Product"}" style="width: 50px; height: auto; margin-right: 10px; vertical-align: middle;">
                ${item.name || "Demo mobile"}<br>
            </td>
            <td style="padding: 10px; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; text-align: right;">$${(_a = item.finalPrice) === null || _a === void 0 ? void 0 : _a.toFixed(2)}</td>
            <td style="padding: 10px; text-align: right;">$${(_b = (item.finalPrice * item.quantity)) === null || _b === void 0 ? void 0 : _b.toFixed(2)}</td>
        </tr>
    `;
    })
        .join("");
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>Payment Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <tr>
            <td style="background-color:rgb(0, 0, 0); color: #ffffff; padding: 20px; text-align: center;">
                <img src="${company.logo}" alt="Company Logo" style="max-width: 150px; height: auto;">
                <h1 style="margin: 0; font-size: 24px;">Payment Confirmation</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 30px;">
                <p style="margin: 0 0 10px; font-size: 16px;">Dear ${"Customer"},</p>
                <p style="margin: 0 0 20px; font-size: 16px;">We've successfully received your payment for order #${order.orderNumber}. Your order is now confirmed and being processed for shipment.</p>
                
                <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 20px; margin-bottom: 20px; background-color:rgb(233, 233, 233);">
                    <h3 style="margin: 0 0 10px; color: #2c3e50; font-size: 18px;">Payment Details</h3>
                    <p style="margin: 0 0 5px; font-size: 14px;"><strong>Payment Date:</strong> ${paymentDate || "June 30, 2025, 09:23 PM"}</p>
                    <p style="margin: 0 0 5px; font-size: 14px;"><strong>Order Number:</strong> ${order.orderNumber}</p>
                    <p style="margin: 0 0 5px; font-size: 14px;"><strong>Payment Method:</strong> ${order.paymentMethod || "stripe"}</p>
                    <p style="margin: 0 0 5px; font-size: 14px;"><strong>Payment Status:</strong> <span style="color: #27ae60; font-weight: bold;">Paid</span></p>
                    <p style="margin: 0 0 5px; font-size: 14px;"><strong>Amount Paid:</strong> $${(_a = order.totalAmount) === null || _a === void 0 ? void 0 : _a.toFixed(2)}</p>
                    
                    <h4 style="margin: 10px 0 5px; color: #2c3e50; font-size: 16px;">Shipping Address</h4>
                    <p style="margin: 0; font-size: 14px;">${shippingAddress.address}</p>
                </div>

                <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f8f8f8;">
                            <th style="padding: 10px; text-align: left; font-size: 14px; border-bottom: 1px solid #e0e0e0;">Item</th>
                            <th style="padding: 10px; text-align: center; font-size: 14px; border-bottom: 1px solid #e0e0e0;">Quantity</th>
                            <th style="padding: 10px; text-align: right; font-size: 14px; border-bottom: 1px solid #e0e0e0;">Price</th>
                            <th style="padding: 10px; text-align: right; font-size: 14px; border-bottom: 1px solid #e0e0e0;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>

                <div style="text-align: right; margin-top: 10px; font-weight: bold; font-size: 14px;">
                    <p style="margin: 0 0 5px;">Subtotal: $${((_b = (order.totalAmount -
        order.taxAmount -
        order.shippingCost)) === null || _b === void 0 ? void 0 : _b.toFixed(2)) || "100000.00"}</p>
                    <p style="margin: 0 0 5px;">Shipping: $${((_c = order.shippingCost) === null || _c === void 0 ? void 0 : _c.toFixed(2)) || "30.00"}</p>
                    <p style="margin: 0 0 5px;">Tax: $${((_d = order.taxAmount) === null || _d === void 0 ? void 0 : _d.toFixed(2)) || "10.00"}</p>
                    <p style="margin: 0 0 5px; color: #27ae60;">Total Paid: $${((_e = order.totalAmount) === null || _e === void 0 ? void 0 : _e.toFixed(2)) || "100040.00"}</p>
                </div>

                <p style="text-align: center; margin: 20px 0;">
                    <a href="${process.env.CLIENT_URL}/my-profile?tab=orders&invoice=${order.orderNumber}" style="display: inline-block; padding: 12px 24px; background-color:rgb(0, 0, 0); color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px;">Track Your Order</a>
                </p>

                <p style="margin: 0 0 10px; font-size: 14px;">Your order will be processed and shipped within 1-2 business days. You'll receive a shipping confirmation email with tracking information once your order is on its way.</p>
                
                <p style="margin: 0 0 10px; font-size: 14px;">If you have any questions about your payment or order, please contact our customer support team at ${company.email} or ${company.phone}.</p>
                
                <p style="margin: 0 0 10px; font-size: 14px;">Thank you for your business!</p>
                <p style="margin: 0; font-size: 14px;">Best regards,<br>The ${company.name} Team</p>
            </td>
        </tr>
                  <tr>
              <td style="background-color: #f8f8f8; padding: 20px; text-align: center; color: #666666; font-size: 12px;">
                  <p style="margin: 0;">${company.name} | ${company.name} | <a href="mailto:${company.email}" style="color: #666666; text-decoration: none;">${company.email}</a></p>
                  <p style="margin: 0;">© ${new Date().getFullYear()} ${company.name}. All rights reserved.</p>
              </td>
          </tr>
    </table>
</body>
</html>
    `;
};
const sendPaymentConfirmationEmail = (user, order) => __awaiter(void 0, void 0, void 0, function* () {
    const subject = `Payment Confirmed - Order #${order.orderNumber}`;
    const html = generatePaymentConfirmationEmailHTML(order, user);
    return (0, sendEmail_1.sendEmail)(user.email, html, subject);
});
exports.default = sendPaymentConfirmationEmail;
