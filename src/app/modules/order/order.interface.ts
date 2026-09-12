import { Types } from "mongoose";
import { IAddress } from "../address/address.interface";
import { IOrderTrackingData } from "../metaPixel/metaPixel.interface";

// Interface for Order Item
export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  quantity: number;
  finalPrice: number;
  originalPrice: number;
  discountApplied: {
    type: "product" | "flashSale" | "deal";
    refId?: Types.ObjectId;
    description?: string;
    discountValue: number;
  };
  image?: string;
  tax: number;
  shipping: number;
}

// Interface for Status History
export interface IStatusHistory {
  status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "returned"
    | "confirmed";
  timestamp: Date;
  notes?: string;
  updatedBy?: Types.ObjectId;
}

// Interface for Payment Details
export interface IPaymentDetails {
  transactionId?: string;
  paymentDate?: Date;
}

// Main Order Interface
export interface IOrder {
  user: Types.ObjectId;
  trackingNumber?: string;
  orderNumber: string;
  items: IOrderItem[];
  subtotal: number;
  couponDiscount: {
    refId: Types.ObjectId;
    description: string;
    discountValue: number;
  };
  shippingAddress: IAddress;
  billingAddress: IAddress;
  totalAmount: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  paymentMethod: "card" | "paypal" | "bank_transfer" | "cod";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentDetails: IPaymentDetails;
  statusHistory: IStatusHistory[];
  currentStatus:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "returned";
  shippingMethod: "standard" | "express" | "overnight";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  trackingData?: IOrderTrackingData;
}

export type AddOrderPayload = {
  products: {
    id: Types.ObjectId;
    quantity: number;
    offer: {
      type: "deal" | "flashSale";
      refId: Types.ObjectId;
    };
  }[];
  billingAddress: IAddress;
  shippingAddress: IAddress;
  paymentMethod: "card" | "paypal" | "bank_transfer" | "cod";
  shippingMethod: "standard" | "express" | "overnight";
  notes?: string;
  saveAddress?: boolean;
  tracking?: {
    fbp?: string;
    fbc?: string;
    fbclid?: string;
    eventSourceUrl?: string;
    eventId?: string;
  };
};
