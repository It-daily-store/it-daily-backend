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
exports.generateOrderNumber = exports.calculateDiscountPrice = void 0;
const calculateDiscountPrice = (price, discount) => {
    let discountPrice = price;
    let discountAmount = 0;
    if (!discount) {
        return { discountPrice, discountAmount };
    }
    if (discount.type === "flat") {
        discountPrice = Number(price) - Number(discount.value);
        discountAmount = Number(price) - discountPrice;
    }
    if (discount.type === "percent") {
        discountPrice = price - price * (discount.value / 100);
        discountAmount = Number(price) - discountPrice;
    }
    return { discountPrice, discountAmount };
};
exports.calculateDiscountPrice = calculateDiscountPrice;
const generateOrderNumber = (OrderModel) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        // Get start and end of today
        const startOfDay = new Date(year, today.getMonth(), today.getDate(), 0, 0, 0);
        const endOfDay = new Date(year, today.getMonth(), today.getDate(), 23, 59, 59);
        // Count orders for today
        const countToday = yield OrderModel.countDocuments({
            createdAt: { $gte: startOfDay, $lte: endOfDay },
        });
        // Increment for the new order
        const orderSequence = countToday + 1;
        return `GG-${year}${month}${day}${orderSequence
            .toString()
            .padStart(4, "0")}`;
    }
    catch (error) {
        console.log(error);
    }
});
exports.generateOrderNumber = generateOrderNumber;
