import { Schema, model } from "mongoose";
import { IDeal } from "./deals.interface";

const dealSchema = new Schema<IDeal>(
  {
    title: {
      type: String,
      required: [true, "Deal title is required"],
      trim: true,
      maxlength: [200, "Deal title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Deal description cannot exceed 1000 characters"],
    },
    image: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product ID is required"],
        },
        discount: {
          type: {
            type: String,
            enum: ["percent", "flat"],
            required: [true, "Discount type is required"],
          },
          value: {
            type: Number,
            required: [true, "Discount value is required"],
            min: [0, "Discount value must be positive"],
          },
        },
        dealStock: {
          type: Number,
          min: [0, "Deal stock cannot be negative"],
        },
      },
    ],
    startTime: {
      type: String,
      required: [true, "Deal start time is required"],
    },
    endTime: {
      type: String,
      required: [true, "Deal end time is required"],
      validate: {
        validator: function (this: IDeal, value: string) {
          return new Date(value) > new Date(this.startTime);
        },
        message: "End time must be after start time",
      },
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
dealSchema.index({ isActive: 1, startTime: 1, endTime: 1 });
dealSchema.index({ "products.productId": 1 });

// Virtual to check if deal is currently running
dealSchema.virtual("isRunning").get(function () {
  const now = new Date();
  return (
    this.isActive &&
    new Date(this.startTime) <= now &&
    new Date(this.endTime) >= now
  );
});

// Pre-save middleware to validate deal dates
dealSchema.pre("save", function (next) {
  if (this.startTime >= this.endTime) {
    return next(new Error("Start time must be before end time"));
  }
  next();
});

const Deal = model<IDeal>("Deal", dealSchema);

export default Deal;
