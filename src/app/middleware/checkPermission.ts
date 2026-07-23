import httpStatus from "http-status";
import AppError from "../errors/AppError";
import { User } from "../modules/user/user.model";
import catchAsync from "../utils/catchAsync";
import { TCrud, TRole } from "../modules/roles/roles.interface";
import { Roles } from "../modules/roles/roles.model";

type TAccessType = keyof TCrud;

const checkPermission = (feature: string, accessType: TAccessType) => {
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
        "unauthorized access request"
      );
    }

    if (!userExist.isActive) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Your account is blocked",
        "unauthorized access request"
      );
    }

    const role: TRole | null = await Roles.findById(userExist.role);

    if (!role || role.isDeleted) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized user request");
    }

    const permission = role.permissions.find((p) => p.feature === feature);

    const hasPermission = permission?.access[accessType] === true;

    if (!hasPermission) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        `You do not have permission to ${accessType} ${feature}`
      );
    } else {
      next();
    }
  });
};

export default checkPermission;
