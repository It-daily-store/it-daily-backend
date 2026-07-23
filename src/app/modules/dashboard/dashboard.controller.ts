import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { DashboardService } from "./dashboard.service";

const getDashboardAnalytics = catchAsync(async (req, res) => {
  const year = req.query.year as string;

  const result = await DashboardService.getDashboardAnalyticsFromDB(year);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Successfully retrived dashboard analytics data",
    success: true,
    data: result,
  });
});

export const DashboardController = {
  getDashboardAnalytics,
};
