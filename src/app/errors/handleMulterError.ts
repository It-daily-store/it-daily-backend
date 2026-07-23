import { MulterError } from "multer";
import {
  TErrorSourse,
  TGenericErrorResponse,
} from "../interface/error.interface";
import config from "../config";

const handleMulterError = (err: MulterError): TGenericErrorResponse => {
  console.log({ multererro: err });

  const errorSources: TErrorSourse = [
    {
      path: err?.field || "",
      message: `Failed to upload to multer, ${err.message}`,
    },
  ];

  return {
    success: false,
    statusCode: 400,
    message: "Failed to upload file",
    errorSources,
    stack: config.node_environment === "development" ? err?.stack : null,
  };
};

export default handleMulterError;
