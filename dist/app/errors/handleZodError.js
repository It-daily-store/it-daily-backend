"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleZodError = void 0;
const config_1 = __importDefault(require("../config"));
const handleZodError = (err) => {
    const errorSources = err.issues.map((issue) => ({
        path: issue.path[issue.path.length - 1],
        message: issue.message,
    }));
    return {
        success: false,
        statusCode: 400,
        message: "Data validation error",
        errorSources,
        stack: config_1.default.node_environment === "development" ? err === null || err === void 0 ? void 0 : err.stack : null,
    };
};
exports.handleZodError = handleZodError;
