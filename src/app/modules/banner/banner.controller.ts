import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BannerTemplateServices } from "./banner.service";
import { assertTreeDepth } from "./banner.utils";

const assertBreakpointsDepth = (breakpoints?: Record<string, unknown>) => {
  if (!breakpoints) return;
  assertTreeDepth(breakpoints.laptop);
  assertTreeDepth(breakpoints.tablet);
  assertTreeDepth(breakpoints.mobile);
};

const createTemplate = catchAsync(async (req, res) => {
  const { userData } = req.user;
  assertBreakpointsDepth(req.body.breakpoints);

  const result = await BannerTemplateServices.createTemplateIntoDB(
    req.body,
    userData
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Banner template created successfully",
    data: result,
  });
});

const getAllTemplates = catchAsync(async (req, res) => {
  const result = await BannerTemplateServices.getAllTemplatesFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Fetched all banner templates successfully",
    data: result,
  });
});

const getTemplateById = catchAsync(async (req, res) => {
  const result = await BannerTemplateServices.getTemplateByIdFromDB(
    req.params.id
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Fetched banner template successfully",
    data: result,
  });
});

const updateTemplate = catchAsync(async (req, res) => {
  assertBreakpointsDepth(req.body.breakpoints);

  const result = await BannerTemplateServices.updateTemplateIntoDB(
    req.params.id,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Banner template updated successfully",
    data: result,
  });
});

const renameTemplate = catchAsync(async (req, res) => {
  const result = await BannerTemplateServices.renameTemplateIntoDB(
    req.params.id,
    req.body.name
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Banner template renamed successfully",
    data: result,
  });
});

const duplicateTemplate = catchAsync(async (req, res) => {
  const { userData } = req.user;
  const result = await BannerTemplateServices.duplicateTemplateIntoDB(
    req.params.id,
    userData
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Banner template duplicated successfully",
    data: result,
  });
});

const deleteTemplate = catchAsync(async (req, res) => {
  const result = await BannerTemplateServices.deleteTemplateFromDB(
    req.params.id
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Banner template deleted successfully",
    data: result,
  });
});

export const BannerTemplateController = {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  renameTemplate,
  duplicateTemplate,
  deleteTemplate,
};
