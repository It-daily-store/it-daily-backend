import { Model, Query } from "mongoose";
import { TProduct } from "../product/product.interface";

export const calculateDiscountPrice = (
  price: number,
  discount: TProduct["discount"]
): { discountPrice: number; discountAmount: number } => {
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

export const generateOrderNumber = async <T>(OrderModel: Query<T[], T>) => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    // Get start and end of today
    const startOfDay = new Date(
      year,
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0
    );
    const endOfDay = new Date(
      year,
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    );

    // Count orders for today
    const countToday = await OrderModel.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    // Increment for the new order
    const orderSequence = countToday + 1;

    return `GG-${year}${month}${day}${orderSequence
      .toString()
      .padStart(4, "0")}`;
  } catch (error) {
    console.log(error);
  }
};
