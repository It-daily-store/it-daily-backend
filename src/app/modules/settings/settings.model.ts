import { model, Schema } from "mongoose";
import { ISettings, PcCategory, PcPart } from "./settings.interface";

const pcPartSchema = new Schema<PcPart>({
  id: {
    type: Number,
    required: true,
    unique: true,
    min: 1000,
    max: 1100,
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    ref: "Category",
  },
  isRequired: {
    type: Boolean,
    required: true,
  },
});

const pcCategorySchema = new Schema<PcCategory>({
  title: {
    type: String,
    required: true,
  },
  parts: [pcPartSchema],
});

const pcBuildSchema = new Schema({
  coreComponents: pcCategorySchema,
  peripherals: pcCategorySchema,
});

const SettingsSchema = new Schema<ISettings>(
  {
    pcBuilder: pcBuildSchema,
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

const Settings = model("Settings", SettingsSchema);

export default Settings;
