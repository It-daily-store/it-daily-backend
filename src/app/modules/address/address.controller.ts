import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AddressService } from "./address.service";

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

const createAddress = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const result = await AddressService.createAddressIntoDB(
    userId.toString(),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Address saved successfully",
    data: result,
  });
});

const updateAddress = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const result = await AddressService.updateAddressIntoDB(
    userId.toString(),
    req.params.id,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Address updated successfully",
    data: result,
  });
});

const setDefaultAddress = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const result = await AddressService.setDefaultAddressIntoDB(
    userId.toString(),
    req.params.id
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Default address updated successfully",
    data: result,
  });
});

const deleteAddress = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const result = await AddressService.deleteAddressFromDB(
    userId.toString(),
    req.params.id
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Address deleted successfully",
    data: result,
  });
});

export const AddressController = {
  getMyAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
};
