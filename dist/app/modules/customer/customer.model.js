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
exports.Customer = void 0;
const mongoose_1 = require("mongoose");
const AdminNameSchema = new mongoose_1.Schema({
    firstName: { type: String, required: [true, "First name is required"] },
    middleName: { type: String, default: "" },
    lastName: { type: String, required: [true, "Last name is required"] },
});
const AddressSchema = new mongoose_1.Schema({
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    country: { type: String, default: "" },
});
const CustomerSchema = new mongoose_1.Schema({
    address: {
        type: AddressSchema,
        default: {
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
        },
    },
    email: {
        type: String,
        required: [true, "Email is required"],
    },
    name: {
        type: AdminNameSchema,
        required: [true, "Name is required"],
    },
    profilePicture: {
        type: String,
        default: "",
    },
    user: {
        type: mongoose_1.Schema.ObjectId,
        required: [true, "User is required"],
        ref: "User",
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
});
CustomerSchema.virtual("fullName").get(function () {
    if (!this.name)
        return;
    const { firstName, middleName, lastName } = this.name;
    return [firstName, middleName, lastName].filter(Boolean).join(" ");
});
CustomerSchema.statics.findAllVerifiedAdmins = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield exports.Customer.find({
        isDeleted: false,
        role: { $ne: "customer" },
    }).populate([
        {
            path: "user",
            match: { isVerified: true },
        },
    ]);
    return result;
});
CustomerSchema.set("toJSON", {
    virtuals: true,
});
exports.Customer = (0, mongoose_1.model)("Cutomer", CustomerSchema);
