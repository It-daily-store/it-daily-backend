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
exports.Brand = void 0;
const mongoose_1 = require("mongoose");
const brandSchema = new mongoose_1.Schema({
    image: {
        type: String,
        default: "",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    name: {
        type: String,
        required: [true, "Name is required"],
    },
    createdBy: {
        type: String,
        required: true,
        ref: "User",
    },
});
brandSchema.statics.findBrandByName = (name) => __awaiter(void 0, void 0, void 0, function* () {
    const exists = yield exports.Brand.findOne({ name });
    if (!exists) {
        return false;
    }
    else if (exists.isDeleted) {
        return false;
    }
    else {
        return true;
    }
});
brandSchema.statics.findBrandById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield exports.Brand.findById(id);
    return res;
});
brandSchema.index({ name: 1 });
exports.Brand = (0, mongoose_1.model)("Brand", brandSchema);
