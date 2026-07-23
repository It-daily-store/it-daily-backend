import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { DealsServices } from "./deals.service";

const createDeal = catchAsync(async (req, res) => {
  const user = req.user;

  const result = await DealsServices.createDealToDb(req.body, user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New deal added successfully",
    data: result,
  });
});

const addProductsToDeal = catchAsync(async (req, res) => {
  const user = req.user.id;
  const deal = req.params.id;

  const result = await DealsServices.addProductsToDealToDB(
    req.body,
    user,
    deal
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Products added to deal successfully",
    data: result,
  });
});

const getAllDeals = catchAsync(async (req, res) => {
  const result = await DealsServices.getAllDealsFromDB(req.query as any);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Retrived deals successfully",
    data: result.deals,
    pagination: result.pagination,
  });
});

const getDealById = catchAsync(async (req, res) => {
  const result = await DealsServices.getDealByIdFromDB(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Retrived deal successfully",
    data: result,
  });
});

const getProductsForDeal = catchAsync(async (req, res) => {
  const result = await DealsServices.getProductsForDealFromDB(
    req.params.id,
    req.query
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Retrived deal successfully",
    data: result.products,
    pagination: result.pagination,
  });
});

const updateDeal = catchAsync(async (req, res) => {
  const result = await DealsServices.updateDealToDB(
    req.params.id,
    req.user.id,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Updated deal successfully",
    data: result,
  });
});

export const DealsController = {
  createDeal,
  addProductsToDeal,
  getAllDeals,
  getDealById,
  getProductsForDeal,
  updateDeal,
};
