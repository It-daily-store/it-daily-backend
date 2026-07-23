"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const zod_1 = require("zod");
const handleZodError_1 = require("../errors/handleZodError");
const handleCastError_1 = require("../errors/handleCastError");
const handleDuplicateError_1 = __importDefault(require("../errors/handleDuplicateError"));
const handleMulterError_1 = __importDefault(require("../errors/handleMulterError"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const config_1 = __importDefault(require("../config"));
const mongoose_1 = __importDefault(require("mongoose"));
const handleValidationError_1 = require("../errors/handleValidationError");
const globalErrorHandler = (err, req, res, next) => {
    let message = err.message || "Something went wrong";
    let statusCode = err.statusCode || 500;
    console.log(err);
    let errorSources = [
        {
            path: "",
            message: "Something went wrong",
        },
    ];
    if (err instanceof zod_1.ZodError) {
        const simplifiedError = (0, handleZodError_1.handleZodError)(err);
        return res.status(simplifiedError.statusCode).json(simplifiedError);
    }
    if ((err === null || err === void 0 ? void 0 : err.name) === "CastError") {
        const simplifiedError = (0, handleCastError_1.handleCastError)(err);
        return res.status(simplifiedError.statusCode).json(simplifiedError);
    }
    if (err instanceof mongoose_1.default.Error.ValidationError) {
        const simplifiedError = (0, handleValidationError_1.handleValidationError)(err);
        return res.status(simplifiedError.statusCode).json(simplifiedError);
    }
    if (err.code === 11000) {
        const simplifiedError = (0, handleDuplicateError_1.default)(err);
        return res.status(simplifiedError.statusCode).json(simplifiedError);
    }
    if (err.name === "MulterError") {
        const simplifiedError = (0, handleMulterError_1.default)(err);
        return res.status(simplifiedError.statusCode).json(simplifiedError);
    }
    if (err instanceof AppError_1.default) {
        return res.status(err.statusCode).json({
            success: false,
            statusCode: err.statusCode,
            message: err.message,
            errorSources: [
                {
                    path: "",
                    message: err.message,
                }
            ],
            stack: config_1.default.node_environment === "development" ? err === null || err === void 0 ? void 0 : err.stack : null,
        });
    }
    if (err instanceof Error) {
        return res.status(statusCode).json({
            success: false,
            statusCode: statusCode,
            message: err.message,
            errorSources: [
                {
                    path: "",
                    message: err.message,
                }
            ],
            stack: config_1.default.node_environment === "development" ? err === null || err === void 0 ? void 0 : err.stack : null,
        });
    }
    return res.status(statusCode).json({
        statusCode,
        success: false,
        message,
        errorSources,
        err,
    });
};
exports.globalErrorHandler = globalErrorHandler;
