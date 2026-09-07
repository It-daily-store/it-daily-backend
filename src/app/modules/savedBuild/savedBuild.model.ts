import { model, Schema } from "mongoose";
import { ISavedBuild, ISavedBuildPart } from "./savedBuild.interface";

const savedBuildPartSchema = new Schema<ISavedBuildPart>(
  {
    partId: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
    // Stored as a reference, not a snapshot, so a saved build always reflects
    // the product's current price and availability.
    product: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
  },
  { _id: false }
);

const savedBuildSchema = new Schema<ISavedBuild>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    parts: {
      type: [savedBuildPartSchema],
      default: [],
    },
  },
  { timestamps: true }
);

savedBuildSchema.index({ user: 1, createdAt: -1 });

const SavedBuild = model<ISavedBuild>("SavedBuild", savedBuildSchema);

export default SavedBuild;
