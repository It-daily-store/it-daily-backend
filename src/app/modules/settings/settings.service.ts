import { Types } from "mongoose";
import { ISettings } from "./settings.interface";
import Settings from "./settings.model";

const defaultSettings: ISettings = {
  pcBuilder: {
    coreComponents: {
      title: "Core Components",
      parts: [
        { id: 1000, name: "Processor", category: "", isRequired: true },
        { id: 1001, name: "Motherboard", category: "", isRequired: true },
        { id: 1002, name: "RAM", category: "", isRequired: true },
        { id: 1003, name: "Storage", category: "", isRequired: true },
        { id: 1004, name: "Graphics Card", category: "", isRequired: false },
        { id: 1005, name: "Power Supply", category: "", isRequired: false },
        { id: 1006, name: "CPU Cooler", category: "", isRequired: false },
        { id: 1007, name: "Casing", category: "", isRequired: false },
      ],
    },
    peripherals: {
      title: "Peripherals & Others",
      parts: [
        { id: 1008, name: "Monitor", category: "", isRequired: false },
        { id: 1009, name: "Case Fan", category: "", isRequired: false },
        { id: 1010, name: "UPS", category: "", isRequired: false },
        { id: 1011, name: "Software", category: "", isRequired: false },
        { id: 1012, name: "Mouse", category: "", isRequired: false },
        { id: 1013, name: "Keyboard", category: "", isRequired: false },
        { id: 1014, name: "Headphone", category: "", isRequired: false },
      ],
    },
  },
};

const getSettingsFromDB = async () => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = new Settings(defaultSettings);
    await settings.save();
  }

  return settings;
};

const updateSettingsToDB = async (
  user: Types.ObjectId,
  data: Partial<ISettings>
) => {
  // Ensure only one settings document exists
  const settings = await Settings.findOneAndUpdate(
    {},
    { $set: { ...data, lastUpdatedBy: user } },
    { new: true, upsert: true }
  );

  return settings;
};

const getPcBuilderFromDB = async () => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = new Settings(defaultSettings);
    await settings.save();
  }

  const pcBuilder = settings.pcBuilder;

  return pcBuilder;
};

export const SettingsService = {
  getSettingsFromDB,
  updateSettingsToDB,
  getPcBuilderFromDB,
};
