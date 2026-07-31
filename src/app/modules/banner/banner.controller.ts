import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import AppError from "../../errors/AppError";
import { BannerServices } from "./banner.service";
import { BANNER_TEMPLATE_IDS } from "./banner.constant";
import { TBannerTemplateId } from "./banner.interface";

const assertValidTemplateId = (id: string): TBannerTemplateId => {
  if (!BANNER_TEMPLATE_IDS.includes(id as TBannerTemplateId)) {
    throw new AppError(httpStatus.BAD_REQUEST, `Invalid banner templateId: ${id}`);
  }
  return id as TBannerTemplateId;
};

const getAllBanners = catchAsync(async (req, res) => {
  const result = await BannerServices.getAllBannersFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Fetched all banner templates successfully",
    data: result,
  });
});

const getActiveBanner = catchAsync(async (req, res) => {
  const result = await BannerServices.getActiveBannerFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Fetched active banner successfully",
    data: result,
  });
});

const updateCarousel = catchAsync(async (req, res) => {
  const result = await BannerServices.updateBannerFromDB("carousel", req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Carousel banner updated successfully",
    data: result,
  });
});

const updateSplitGrid = catchAsync(async (req, res) => {
  const result = await BannerServices.updateBannerFromDB("splitGrid", req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Split grid banner updated successfully",
    data: result,
  });
});

const updateSideBanner = catchAsync(async (req, res) => {
  const result = await BannerServices.updateBannerFromDB("sideBanner", req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Side banner updated successfully",
    data: result,
  });
});

const setActiveBanner = catchAsync(async (req, res) => {
  const templateId = assertValidTemplateId(req.params.templateId);
  const result = await BannerServices.setActiveBannerFromDB(templateId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Active banner template updated successfully",
    data: result,
  });
});

export const BannerController = {
  getAllBanners,
  getActiveBanner,
  updateCarousel,
  updateSplitGrid,
  updateSideBanner,
  setActiveBanner,
};
