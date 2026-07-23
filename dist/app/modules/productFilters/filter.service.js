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
exports.FilterServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const filter_model_1 = __importDefault(require("./filter.model"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const createFilterIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Transform options to include value property
    const formattedPayload = Object.assign(Object.assign({}, payload), { filterId: 1, options: (_a = payload.options) === null || _a === void 0 ? void 0 : _a.map((option) => ({
            value: option,
            optionId: 1,
        })) });
    const result = yield filter_model_1.default.create(formattedPayload);
    return result;
});
const getAllFiltersFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield filter_model_1.default.find();
    return result;
});
const deleteFilterFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const exist = yield filter_model_1.default.findFilterById(id);
    if (!exist) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Product filter does not exists");
    }
    const result = yield filter_model_1.default.findByIdAndDelete(id);
    return result;
});
const updateFilterIntoDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the existing filter
    const existingFilter = yield filter_model_1.default.findById(id);
    if (!existingFilter) {
        throw new Error(`Filter with filterId not found`);
    }
    // Prepare the update payload
    const updatePayload = {};
    // Update title if provided
    if (payload.title !== undefined) {
        updatePayload.title = payload.title;
    }
    // Process options if provided
    if (payload.options !== undefined) {
        const existingOptionIds = new Set(existingFilter.options.map((opt) => opt.optionId));
        let nextOptionId = existingFilter.options.length
            ? Math.max(...existingFilter.options.map((opt) => Number(opt.optionId))) +
                1
            : 1;
        const maxOptionId = 1000;
        updatePayload.options = payload.options.map((newOption) => {
            // Existing option (has optionId): update value, preserve optionId
            if (newOption.optionId !== undefined ||
                newOption.optionId !== "undefined") {
                const existingOption = existingFilter.options.find((opt) => String(opt.optionId) === String(newOption.optionId));
                if (!existingOption) {
                    throw new Error(`Option with optionId ${newOption.optionId} not found in filter`);
                }
                return {
                    optionId: String(newOption.optionId),
                    value: newOption.value,
                };
            }
            // New option (no optionId): assign next available optionId
            while (existingOptionIds.has(String(nextOptionId))) {
                nextOptionId++;
            }
            if (nextOptionId > maxOptionId) {
                throw new Error(`Unable to assign unique option ID for filter maximum ID (${maxOptionId}) reached`);
            }
            existingOptionIds.add(String(nextOptionId));
            return {
                optionId: String(nextOptionId++),
                value: newOption.value,
            };
        });
    }
    // Update only the provided fields
    const result = yield filter_model_1.default.findOneAndUpdate({ filterId: existingFilter.filterId }, { $set: updatePayload }, { new: true, runValidators: true });
    return result;
});
exports.FilterServices = {
    createFilterIntoDB,
    updateFilterIntoDB,
    getAllFiltersFromDB,
    deleteFilterFromDB,
};
