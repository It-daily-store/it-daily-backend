import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { FilterServices } from "./filter.service";

const createFilter = catchAsync(async (req, res) => {
  const result = await FilterServices.createFilterIntoDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product filter created successfully",
    data: result,
  });
});

const updateFilter = catchAsync(async (req, res) => {
  const payload = req.body;
  const id = req.params.id;

  const result = await FilterServices.updateFilterIntoDB(id, payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "updated product filter successfully",
    data: result,
  });
});

const getAllFilters = catchAsync(async (req, res) => {
  const result = await FilterServices.getAllFiltersFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "successfully retrived all product fitlers",
    data: result,
  });
});

const deleteFilter = catchAsync(async (req, res) => {
  const result = await FilterServices.deleteFilterFromDB(req.params.id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "successfully deleted product fitlers",
    data: result,
  });
});

export const FilterControllers = {
  createFilter,
  updateFilter,
  getAllFilters,
  deleteFilter,
};
