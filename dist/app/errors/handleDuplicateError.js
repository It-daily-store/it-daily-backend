"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../config"));
const handleDuplicateError = (err) => {
    const errorSources = [
        {
            path: err && (err === null || err === void 0 ? void 0 : err.keyPattern) && Object.keys(err === null || err === void 0 ? void 0 : err.keyPattern)[0] || "",
            message: `${err && (err === null || err === void 0 ? void 0 : err.keyValue) && Object.values(err === null || err === void 0 ? void 0 : err.keyValue)[0]} already exists`
        }
    ];
    return {
        success: false,
        statusCode: 400,
        message: 'Duplicate id error',
        errorSources,
        stack: config_1.default.node_environment === 'development' ? err === null || err === void 0 ? void 0 : err.stack : null
    };
};
exports.default = handleDuplicateError;
