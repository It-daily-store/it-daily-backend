import { RequestHandler } from "express";
import { ZodTypeAny } from "zod";

export const validateRequest = (zSchema: ZodTypeAny): RequestHandler => {
  return async (req, res, next) => {
    const data = req.body;
    // console.log(data);
    try {
      await zSchema.parseAsync(data);
      next();
    } catch (err) {
      next(err);
    }
  };
};
