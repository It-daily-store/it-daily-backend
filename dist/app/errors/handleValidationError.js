"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidationError = void 0;
const config_1 = __importDefault(require("../config"));
const handleValidationError = (err) => {
    const errorSources = [];
    console.log(Array(err.errors).map(er => {
        Object.keys(er).map(singleError => {
            var _a, _b;
            console.log((_a = er[singleError]) === null || _a === void 0 ? void 0 : _a.message);
            errorSources.push({
                path: singleError,
                message: (_b = er[singleError]) === null || _b === void 0 ? void 0 : _b.message
            });
        });
    }));
    return {
        success: false,
        statusCode: 400,
        message: "Data validation error",
        errorSources,
        stack: config_1.default.node_environment === "development" ? err === null || err === void 0 ? void 0 : err.stack : null,
    };
};
exports.handleValidationError = handleValidationError;
