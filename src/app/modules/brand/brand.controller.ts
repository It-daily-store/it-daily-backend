import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BrandService } from "./brand.service";

const createBrand = catchAsync(async (req, res) => {
  const payload = req.body;
  const { email, userData } = req.user;

  const result = await BrandService.createBrandIntoDB(payload, email, userData);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Brand create successfully",
    data: result,
  });
});

const updateBrand = catchAsync(async (req, res) => {
  const payload = req.body;
  const id = req.params.id;
  const { userData } = req.user;
  const result = await BrandService.updateBrandIntoDB(id, payload, userData);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Brand updated successfully",
    data: result,
  });
});

const getAllBrands = catchAsync(async (req, res) => {
  const result = await BrandService.getAllBrandsFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully retrived all brands",
    data: result,
  });
});

const deleteBrand = catchAsync(async (req, res) => {
  const id = req.params.id;
  const { userData } = req.user;

  const result = await BrandService.deleteBrandFromDB(id, userData);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully deleted all brand",
    data: result,
  });
});

export const BrandController = {
  createBrand,
  updateBrand,
  getAllBrands,
  deleteBrand,
};
