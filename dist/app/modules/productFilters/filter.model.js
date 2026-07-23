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
const mongoose_1 = require("mongoose");
const FilterSchema = new mongoose_1.Schema({
    filterId: {
        type: Number,
        required: true,
        unique: true,
        min: 1,
        max: 999,
    },
    title: {
        type: String,
        required: [true, "Filter Title is required"],
        unique: true,
    },
    options: [
        {
            optionId: {
                type: mongoose_1.Schema.Types.Mixed,
                validate: {
                    validator: (v) => typeof v === "string" || typeof v === "number",
                    message: (props) => `${props.value} must be a string or a number`,
                },
                required: true,
                min: 1,
            },
            value: {
                type: String,
                required: true,
            },
        },
    ],
}, {
    timestamps: true,
});
FilterSchema.statics.findFilterById = function (id) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield ProductFilter.findById(id);
        return result;
    });
};
FilterSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isNew) {
            // Assign filterId by finding the highest existing ID and adding 1
            const maxFilterId = 999999;
            const lastFilter = yield ProductFilter.findOne()
                .sort({ filterId: -1 }) // Sort descending to get highest filterId
                .select("filterId");
            let filterId = lastFilter ? lastFilter.filterId + 1 : 1;
            if (filterId > maxFilterId) {
                throw new Error(`Unable to assign a unique filter ID; maximum ID (${maxFilterId}) reached`);
            }
            this.filterId = filterId;
            // Assign sequential option IDs
            const existingOptionIds = new Set();
            for (const option of this.options) {
                let optionId = 1;
                const maxOptionId = 1000;
                while (optionId <= maxOptionId) {
                    if (!existingOptionIds.has(optionId)) {
                        option.optionId = String(optionId);
                        existingOptionIds.add(optionId);
                        break;
                    }
                    optionId++;
                }
                if (!option.optionId) {
                    throw new Error("Unable to assign unique option IDs for filter; all IDs from 1 to 1000 are taken");
                }
            }
        }
        next();
    });
});
const ProductFilter = (0, mongoose_1.model)("ProductFilter", FilterSchema);
exports.default = ProductFilter;
