import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import AppError from "../errors/AppError";
import config from "../config";
import { User } from "../modules/user/user.model";
import varifyToken from "../utils/verifyToken";

const validateAuth = () => {
  return catchAsync(async (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "You are not authorized",
        "unauthorized access request"
      );
    }

    // check if varified user
    const decoded = varifyToken(token, config.access_secret as string);

    if (!decoded) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "You are not authorized",
        "unauthorized access request"
      );
    }

    const userExist = await User.isUserExistsByEmail(decoded.email, true);

    req.user = {
      userRole: userExist.role,
      email: userExist.email,
      id: userExist._id,
      userData: userExist,
    };

    next();
  });
};

export const validateCustomer = () => {
  return catchAsync(async (req, res, next) => {
    if (req.user.userRole !== "customer") {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not a customer");
    }

    next();
  });
};

export default validateAuth;
