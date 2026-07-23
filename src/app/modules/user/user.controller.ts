import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { TUser } from "./user.interface";
import { UserServices } from "./user.service";
import { UserValidations } from "./user.validation";

const createUser = catchAsync(async (req, res, next) => {
  const admin: TUser = req.body;

  const result = await UserServices.createAdminIntoDB(admin);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User created successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req, res) => {
  const result = await UserServices.getAllAdminsFromDB(
    req.query.userType as TUser["userType"]
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully retrived all users",
    data: result,
  });
});

const getSingleUser = catchAsync(async (req, res) => {
  const id = req.params.id;
  const query = req.query;
  const result = await UserServices.getSingleUserFromDB(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully retrived user data",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const userId = req.params.userId;
  const role: "admin" | "customer" = req.body.role;

  const authUser = req.user.email;

  const result = await UserServices.deleteUserFromDB(userId, role, authUser);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully deleted user",
    data: result,
  });
});

export const UserController = {
  createUser,
  getAllUsers,
  deleteUser,
  getSingleUser,
};
