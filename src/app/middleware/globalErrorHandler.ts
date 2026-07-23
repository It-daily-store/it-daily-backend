import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { ZodError, ZodIssue } from "zod";
import { TErrorSourse, TGenericErrorResponse } from "../interface/error.interface";
import { handleZodError } from "../errors/handleZodError";
import { handleCastError } from "../errors/handleCastError";
import handleDuplicateError from "../errors/handleDuplicateError";
import handleMulterError from "../errors/handleMulterError";
import AppError from "../errors/AppError";
import config from "../config";
import mongoose from "mongoose";
import { handleValidationError } from "../errors/handleValidationError";

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let message = err.message || "Something went wrong";
  let statusCode = err.statusCode || 500;

  console.log(err)

  let errorSources: TErrorSourse = [
    {
      path: "",
      message: "Something went wrong",
    },
  ];

  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    return res.status(simplifiedError.statusCode).json(simplifiedError);
  }

  if (err?.name === "CastError") {
    const simplifiedError = handleCastError(err);
    return res.status(simplifiedError.statusCode).json(simplifiedError);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const simplifiedError = handleValidationError(err)
    return res.status(simplifiedError.statusCode).json(simplifiedError);
  }

  if (err.code === 11000) {
    const simplifiedError = handleDuplicateError(err);
    return res.status(simplifiedError.statusCode).json(simplifiedError);
  }

  if (err.name === "MulterError") {
    const simplifiedError = handleMulterError(err);
    return res.status(simplifiedError.statusCode).json(simplifiedError);
  }

  if (err instanceof AppError) {
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
      stack: config.node_environment === "development" ? err?.stack : null,
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
      stack: config.node_environment === "development" ? err?.stack : null,
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
