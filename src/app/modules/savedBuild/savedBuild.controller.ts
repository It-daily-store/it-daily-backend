import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SavedBuildService } from "./savedBuild.service";

const getMyBuilds = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const result = await SavedBuildService.getMyBuildsFromDB(userId.toString());

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Retrieved saved builds successfully",
    data: result,
  });
});

const getSingleBuild = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const result = await SavedBuildService.getSingleBuildFromDB(
    userId.toString(),
    req.params.id
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Retrieved saved build successfully",
    data: result,
  });
});

const createBuild = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const result = await SavedBuildService.createBuildIntoDB(
    userId.toString(),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Build saved successfully",
    data: result,
  });
});

const updateBuild = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const result = await SavedBuildService.updateBuildIntoDB(
    userId.toString(),
    req.params.id,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Build updated successfully",
    data: result,
  });
});

const deleteBuild = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const result = await SavedBuildService.deleteBuildFromDB(
    userId.toString(),
    req.params.id
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Build deleted successfully",
    data: result,
  });
});

export const SavedBuildController = {
  getMyBuilds,
  getSingleBuild,
  createBuild,
  updateBuild,
  deleteBuild,
};
