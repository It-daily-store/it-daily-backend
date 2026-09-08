import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { EAppModules, TModulePermission, TRole } from "./roles.interface";
import { Roles } from "./roles.model";

const createRoleIntoDB = async (payload: TRole) => {
  const result = await Roles.create(payload);

  return result;
};

const getAllRolesFromDB = async () => {
  const result = await Roles.find({ isDeleted: false });

  return result;
};

const updateRoleIntoDB = async (payload: TRole, email: string, id: string) => {
  const ThisUser = await User.isUserExistsByEmail(email);

  if (!ThisUser) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User does not exist");
  }

  if (ThisUser.role === id && !ThisUser.isMasterAdmin) {
    throw new AppError(httpStatus.UNAUTHORIZED, "You can't update your own role");
  }

  const thisRole: TRole | null = await Roles.isRoleExist(id);

  if (!thisRole) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Role does not exist");
  }

  const newPermissions: TModulePermission[] = Object.values(EAppModules).map(
    (module) => {
      const payloadPermission = payload.permissions?.find(
        (p) => p.module === module,
      );
      if (payloadPermission) {
        return { module, permissions: payloadPermission.permissions ?? {} };
      }

      const existing = thisRole.permissions?.find((p) => p.module === module);
      if (existing) {
        // Mongoose hydrates this as a Map; normalise before writing it back.
        const permissions =
          existing.permissions instanceof Map
            ? Object.fromEntries(existing.permissions)
            : (existing.permissions ?? {});
        return { module, permissions };
      }

      return { module, permissions: {} };
    },
  );
  const result = await Roles.findByIdAndUpdate(
    id,
    {
      role: payload.role,
      description: payload.description,
      $set: { permissions: newPermissions },
    },
    { new: true }
  );

  return result;
};

const deleteRoleFromDB = async (id: string) => {
  const thisRole: TRole | null = await Roles.isRoleExist(id);
  if (!thisRole) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Role does not exist");
  }

  const result = await Roles.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

  return result;
};

export const RolesService = {
  createRoleIntoDB,
  getAllRolesFromDB,
  updateRoleIntoDB,
  deleteRoleFromDB,
};
