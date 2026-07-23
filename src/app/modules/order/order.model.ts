import { Schema, model, Document, Types } from "mongoose";
import { IOrder, IOrderItem, IStatusHistory } from "./order.interface";

// Order Item Schema
const orderItemSchema = new Schema<IOrderItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"],
    default: 1,
  },
  originalPrice: {
    type: Number,
    required: true,
    min: [0, "Price cannot be negative"],
  },
  finalPrice: {
    type: Number,
    required: true,
    min: [0, "Price cannot be negative"],
  },
  discountApplied: {
    type: {
      type: String,
      enum: ["product", "flashSale", "deal", "coupon"],
    },
    refId: { type: Schema.Types.ObjectId }, // e.g. flashSaleId, dealId, couponId
    description: { type: String, trim: true }, // e.g. "New Year Flash Sale"
    discountValue: { type: Number, min: 0 }, // actual discount amount applied
  },
  image: {
    type: String,
    required: false,
  },
  tax: {
    type: Number,
    required: true,
    min: [0, "Tax cannot be negative"],
    default: 0,
  },
  shipping: {
    type: Number,
    required: true,
    min: [0, "Subtotal cannot be negative"],
    default: 0,
  },
});

// Status History Schema
const statusHistorySchema = new Schema<IStatusHistory>(
  {
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Main Order Schema
const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      address: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      district: {
        type: String,
        required: true,
        trim: true,
      },
    },
    billingAddress: {
      address: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      district: {
        type: String,
        required: true,
        trim: true,
      },
    },
    subtotal: { type: Number, required: true, min: 0 }, // sum of item.finalPrice * qty
    couponDiscount: {
      refId: { type: Schema.Types.ObjectId, ref: "Coupons" },
      description: { type: String, trim: true },
      discountValue: { type: Number, min: 0 },
    },
    trackingNumber: {
      type: String,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },
    shippingCost: {
      type: Number,
      required: true,
      min: [0, "Shipping cost cannot be negative"],
      default: 0,
    },
    taxAmount: {
      type: Number,
      required: true,
      min: [0, "Tax amount cannot be negative"],
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "paypal", "bank_transfer", "cod"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentDetails: {
      transactionId: {
        type: String,
        trim: true,
      },
      paymentDate: {
        type: Date,
      },
    },
    statusHistory: [statusHistorySchema],
    currentStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },
    shippingMethod: {
      type: String,
      enum: ["standard", "express", "overnight"],
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
orderSchema.index({ userId: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware to generate unique order number

const Order = model<IOrder>("Order", orderSchema);

export default Order;
