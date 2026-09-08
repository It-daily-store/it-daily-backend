import httpStatus from "http-status";
import mongoose from "mongoose";
import AppError from "../errors/AppError";
import { User } from "../modules/user/user.model";
import catchAsync from "../utils/catchAsync";
import { EAppModules, TRole } from "../modules/roles/roles.interface";
import { TPermissionKey } from "../modules/roles/roles.permissions";
import { Roles } from "../modules/roles/roles.model";

const checkPermission = (module: EAppModules, key: TPermissionKey) => {
  return catchAsync(async (req, res, next) => {
    const user = req.user;

    const userExist = await User.isUserExistsByEmail(user?.email);

    if (!userExist) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized user request");
    }

    if (userExist.isMasterAdmin) {
      return next();
    }
    if (userExist.isDeleted) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Your account was deleted",
        "unauthorized access request",
      );
    }

    if (!userExist.isActive) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Your account is blocked",
        "unauthorized access request",
      );
    }

    if (!mongoose.isValidObjectId(userExist.role)) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized user request");
    }

    const role: TRole | null = await Roles.findById(userExist.role);

    if (!role || role.isDeleted) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized user request");
    }

    const entry = role.permissions.find((p) => p.module === module);

    // Mongoose hydrates `permissions` as a Map; a lean/plain object needs the
    // bracket read. Support both so this works either way.
    const granted =
      entry?.permissions instanceof Map
        ? entry.permissions.get(key)
        : entry?.permissions?.[key];

    if (granted !== true) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        `You do not have permission: ${key}`,
      );
    }

    next();
  });
};

export default checkPermission;
