import mongoose, { startSession, Types } from "mongoose";
import { TUser } from "./user.interface";
import { User } from "./user.model";

import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { Roles } from "../roles/roles.model";

const createAdminIntoDB = async (admin: TUser) => {
  delete admin.isDeleted;

  const user: Partial<TUser> = {
    email: admin.email,
    password: admin.password,
    name: admin.name,
    role: admin.role,
    userType: "admin",
  };

  const roleExist = await Roles.findById(admin.role);

  if (!roleExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Role does not exist");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const adminExist = await User.isUserExistsByEmail(admin.email);

    if (adminExist) {
      const deleteUser = await User.findOneAndDelete({ email: admin.email });

      if (!deleteUser) {
        throw new AppError(httpStatus.CONFLICT, "failed to create user");
      }
    }

    const userRes = await User.create(user);

    if (!userRes) {
      throw new AppError(httpStatus.CONFLICT, "failed to create user");
    }

    await session.commitTransaction();
    await session.endSession();
    return userRes;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(
      httpStatus.CONFLICT,
      err instanceof AppError ? err?.message : "Failed to create user"
    );
  }
};

const getAllAdminsFromDB = async (userType?: "admin" | "customer") => {
  if (userType === "admin") {
    const result = await User.find({
      isDeleted: false,
      userType: "admin",
    })
      .select("name fullName email role _id profilePicture isActive isVerified")
      .populate([
        {
          path: "role",
          select: "role isDeleted -_id",
        },
      ]);

    return result;
  } else {
    const result = await User.find({
      isDeleted: false,
      userType,
    }).select("name fullName email _id profilePicture isActive isVerified");

    return result;
  }
};

const getSingleUserFromDB = async (id: string) => {
  const userData = await User?.findById(id).populate([
    {
      path: "role",
      select: "role isDeleted -_id",
    },
  ]);

  if (!userData) {
    throw new AppError(httpStatus.CONFLICT, "Failed to get user data");
  }

  if (userData.isDeleted) {
    throw new AppError(httpStatus.CONFLICT, "User was deleted");
  }

  return userData;
};

const deleteUserFromDB = async (
  userId: string,
  role: "admin" | "customer",
  authUserEmail: string
) => {
  if (!userId) {
    throw new AppError(httpStatus.CONFLICT, "User not found");
  }

  const user: TUser | null = await User.findById(userId);

  if (user?.email === authUserEmail) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You can't delete your own account"
    );
  }

  const session = await startSession();

  try {
    session.startTransaction();
    const deletedUser = await User.findByIdAndUpdate(
      userId,
      { isDeleted: true },
      { new: true }
    );
    if (!deletedUser) {
      throw new AppError(httpStatus.CONFLICT, "Failed to delete user");
    }
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    if (err instanceof AppError) {
      throw new AppError(err.statusCode, err.message);
    } else {
      throw new AppError(httpStatus.CONFLICT, "Failed to delete user");
    }
  }
};

export const UserServices = {
  createAdminIntoDB,
  getAllAdminsFromDB,
  deleteUserFromDB,
  getSingleUserFromDB,
};
