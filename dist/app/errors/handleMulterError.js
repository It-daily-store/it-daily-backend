"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../config"));
const handleMulterError = (err) => {
    console.log({ multererro: err });
    const errorSources = [
        {
            path: (err === null || err === void 0 ? void 0 : err.field) || "",
            message: `Failed to upload to multer, ${err.message}`,
        },
    ];
    return {
        success: false,
        statusCode: 400,
        message: "Failed to upload file",
        errorSources,
        stack: config_1.default.node_environment === "development" ? err === null || err === void 0 ? void 0 : err.stack : null,
    };
};
exports.default = handleMulterError;
