import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AddressService } from "./address.service";

const createAddress = catchAsync(async (req, res) => {
  const data = req.body;
});

const getMyAddresses = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const result = await AddressService.getMyAddressesFromDB(userId.toString());

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Retrivied addresses successfully",
    data: result,
  });
});

export const AddressController = {
  getMyAddresses,
};
