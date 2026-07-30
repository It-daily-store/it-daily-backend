import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AddressService } from "./address.service";

// NOTE: this handler is not wired up in address.route.ts (no route references it)
// and does not do anything yet — looks like dead/incomplete code. Left in place
// but made lint-clean; needs a human decision on whether to implement or remove it.
const _createAddress = catchAsync(async (req, _res) => {
  const _data = req.body;
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
