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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const settings_model_1 = __importDefault(require("./settings.model"));
const defaultSettings = {
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
const getSettingsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    let settings = yield settings_model_1.default.findOne();
    if (!settings) {
        settings = new settings_model_1.default(defaultSettings);
        yield settings.save();
    }
    return settings;
});
const updateSettingsToDB = (user, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Ensure only one settings document exists
    const settings = yield settings_model_1.default.findOneAndUpdate({}, { $set: Object.assign(Object.assign({}, data), { lastUpdatedBy: user }) }, { new: true, upsert: true });
    return settings;
});
const getPcBuilderFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    let settings = yield settings_model_1.default.findOne();
    if (!settings) {
        settings = new settings_model_1.default(defaultSettings);
        yield settings.save();
    }
    const pcBuilder = settings.pcBuilder;
    return pcBuilder;
});
exports.SettingsService = {
    getSettingsFromDB,
    updateSettingsToDB,
    getPcBuilderFromDB,
};
