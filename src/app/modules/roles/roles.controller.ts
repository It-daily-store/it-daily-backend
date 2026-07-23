import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import {TRole} from "./roles.interface";
import {RolesService} from "./roles.service";

const createRole = catchAsync(async (req, res) => {
  const role: TRole = req.body;

  const result = await RolesService.createRoleIntoDB(role);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Role created successfully",
    data: result,
  });
});

const getAllRoles = catchAsync(async (req, res) => {
  const result = await RolesService.getAllRolesFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "retrived all roles successfully",
    data: result,
  });
});

const updateRole = catchAsync(async (req, res) => {
  const email = req.user.email;
  const payload = req.body;
  const id = req.params.id;

  const result = await RolesService.updateRoleIntoDB(payload, email, id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Updated role successfully",
    data: result,
  });
});

const deleteRole = catchAsync(async (req, res) => {
  const id = req.params.id;

  const result = await RolesService.deleteRoleFromDB(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Role deleted successfully",
    data: result,
  });
});

export const RolesController = {
  createRole,
  getAllRoles,
  updateRole,
  deleteRole,
};
