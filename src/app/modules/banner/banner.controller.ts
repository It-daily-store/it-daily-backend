import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BannerServices } from "./banner.service";

const getBanner = catchAsync(async (req, res) => {
  const id = req.params.id;
  console.log(req.params, req.query);
  const result = await BannerServices.getBannerFromDB(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Fetched banner data successfully",
    data: result,
  });
});

export const BannerController = { getBanner };
