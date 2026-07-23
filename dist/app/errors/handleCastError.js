"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCastError = void 0;
const config_1 = __importDefault(require("../config"));
const handleCastError = (err) => {
    const errorSources = [
        {
            path: err.path,
            message: err.message
        }
    ];
    return {
        success: false,
        statusCode: 400,
        message: 'Invalid id',
        errorSources,
        stack: config_1.default.node_environment === 'development' ? err === null || err === void 0 ? void 0 : err.stack : null
    };
};
exports.handleCastError = handleCastError;
