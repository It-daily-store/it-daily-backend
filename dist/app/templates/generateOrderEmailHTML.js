"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrderEmailHTML = void 0;
const generateOrderEmailHTML = (order) => {
    var _a, _b, _c, _d;
    // Sample data based on your image and schema
    const orderDate = new Date(order === null || order === void 0 ? void 0 : order.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Dhaka", // Adjust for +06 timezone
    });
    const shippingAddress = order.shippingAddress;
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
    <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <tr>
            <td style="background-color:rgb(7, 7, 7); color: #ffffff; padding: 20px; text-align: center;">
                <img src="test" alt="Company Logo" style="max-width: 150px; height: auto;">
                <h1 style="margin: 0; font-size: 24px;">Order Confirmation</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 30px;">
                <p style="margin: 0 0 10px; font-size: 16px;">Dear ${"Customer"},</p>
                <p style="margin: 0 0 20px; font-size: 16px;">Thank you for your order! We're excited to confirm that we've received your order ${order.orderNumber}. Our team is already working on getting it ready for you.</p>
                
                <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 20px; margin-bottom: 20px; background-color:rgb(233, 233, 233);">
                    <h3 style="margin: 0 0 10px; color: #2c3e50; font-size: 18px;">Order Details</h3>
                    <p style="margin: 0 0 5px; font-size: 14px;"><strong>Order Date:</strong> ${orderDate || "June 25, 2025, 09:23 PM"}</p>
                    <p style="margin: 0 0 5px; font-size: 14px;"><strong>Order Number:</strong> ${order.orderNumber || "TS-271245846"}</p>
                    <p style="margin: 0 0 5px; font-size: 14px;"><strong>Payment Method:</strong> ${order.paymentMethod || "cod"}</p>
                    <p style="margin: 0 0 5px; font-size: 14px;"><strong>Payment Status:</strong> ${order.paymentStatus || "cod"}</p>
                    
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
                    <p style="margin: 0 0 5px;">Subtotal: $${((_a = (order.totalAmount -
        order.taxAmount -
        order.shippingCost)) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || "100000.00"}</p>
                    <p style="margin: 0 0 5px;">Shipping: $${((_b = order.shippingCost) === null || _b === void 0 ? void 0 : _b.toFixed(2)) || "30.00"}</p>
                    <p style="margin: 0 0 5px;">Tax: $${((_c = order.taxAmount) === null || _c === void 0 ? void 0 : _c.toFixed(2)) || "10.00"}</p>
                    <p style="margin: 0 0 5px;">Total: $${((_d = order.totalAmount) === null || _d === void 0 ? void 0 : _d.toFixed(2)) || "100040.00"}</p>
                </div>

                <p style="text-align: center; margin: 20px 0;">
                    <a href="${process.env.CLIENT_URL}/my-profile?tab=orders&invoice=${order.orderNumber}" style="display: inline-block; padding: 12px 24px; background-color:rgb(0, 0, 0); color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px;">Track Your Order</a>
                </p>

                <p style="margin: 0 0 10px; font-size: 14px;">If you have any questions about your order, please contact our customer support team at gadgetGrid@gmail.com or +088334-343-343.</p>
                
                <p style="margin: 0 0 10px; font-size: 14px;">Thank you for shopping with us!</p>
                <p style="margin: 0; font-size: 14px;">Best regards,<br>The 
                  Gadget Grid Team</p>
            </td>
        </tr>
                  <tr>
              <td style="background-color: #f8f8f8; padding: 20px; text-align: center; color: #666666; font-size: 12px;">
                  <p style="margin: 0;">gadgetGrid@gmail.com</a></p>
                  <p style="margin: 0;">© ${new Date().getFullYear()} Gadget Grid. All rights reserved.</p>
              </td>
          </tr>
    </table>
</body>
</html>
    `;
};
exports.generateOrderEmailHTML = generateOrderEmailHTML;
