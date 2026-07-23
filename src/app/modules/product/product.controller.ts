import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ProductServices } from "./product.service";
import { Product } from "./product.model";

const createProduct = catchAsync(async (req, res) => {
  const { userData, email } = req.user;
  const result = await ProductServices.createProductIntoDB(
    req.body,
    email,
    userData
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully Created Product",
    data: result,
  });
});

const getAllProduct = catchAsync(async (req, res) => {
  const query = req.query;
  const result = await ProductServices.getAllProductsFromDB(query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully retrived all products",
    data: result.products,
    pagination: result.pagination,
  });
});

const getSingleProduct = catchAsync(async (req, res) => {
  const result = await ProductServices.getSingleProductFromDB(
    req.params.id,
    req.query
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully retrived product",
    data: result,
  });
});

const bulkUpload = catchAsync(async (req, res) => {
  const email = req.user.email;
  const file = req.file;
  const mapedFields = JSON.parse(req.body.mapedFields);
  const result = await ProductServices.bulkUploadToDB(file, mapedFields, email);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product bulk upload complete",
    data: result,
  });
});

const updateProduct = catchAsync(async (req, res) => {
  const id = req.params.id;
  const { userData } = req.user;

  const result = await ProductServices.updateProductIntoDB(
    id,
    req.body,
    userData
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Updated product successfully",
    data: result,
  });
});
const getFeaturedProducts = catchAsync(async (req, res) => {
  const result = await ProductServices.getFeaturedProductFromDB(
    req.query?.limit as string
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Fetched featured products successfully",
    data: result,
  });
});

const getProductsByCategory = catchAsync(async (req, res) => {
  const result = await ProductServices.getProductByCategoryFromDB(
    req.params.slug,
    req.query
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully retrived all products",
    data: result.result,
    pagination: result.pagination,
  });
});
const getFiltersByCategory = catchAsync(async (req, res) => {
  const result = await ProductServices.getFiltersByCategoryFromDB(
    req.params.slug
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully retrived all filters",
    data: result.result,
  });
});

const getSingleProductBySlug = catchAsync(async (req, res) => {
  const result = await ProductServices.getSingleProductBySlugFromDB(
    req.params.slug
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully retrived product",
    data: result,
  });
});

const getCompareProducts = catchAsync(async (req, res) => {
  const ids = req.query.ids;

  const productIds = ids ? JSON.parse(ids as string) : [];

  const result = await Product.find({ _id: { $in: productIds } });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully retrived product",
    data: result,
  });
});

const getSearchProducts = catchAsync(async (req, res) => {
  const query = req.query;

  const result = await ProductServices.getSearchProductsFromDB(query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully retrived product",
    data: result,
  });
});

const downloadJsonTemplate = catchAsync(async (req, res) => {
  const query = req.query;
  const result = await ProductServices.downloadJsonTemplate(query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Template retrived successfully",
    data: result,
  });
});

const jsonBulkUpload = catchAsync(async (req, res) => {
  const result = await ProductServices.bulkUploadJsonToDB(
    req.file,
    req.user.email
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Upload successfull",
    data: result,
  });
});

const getStaticProductSlugs = catchAsync(async (req, res) => {
  const result = await ProductServices.getStaticProductSlugsFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product retrived successfully",
    data: result,
  });
});

const getPcBuilderProducts = catchAsync(async (req, res) => {
  const result = await ProductServices.getPcBuilderProductsFromDB(
    req.params.id,
    req.query
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Products retrived successfully",
    data: {
      products: result.products,
      filters: result.filters,
    },
    pagination: result.pagination,
  });
});

export const ProductControllers = {
  getSingleProductBySlug,
  createProduct,
  getAllProduct,
  bulkUpload,
  getSingleProduct,
  updateProduct,
  getFeaturedProducts,
  getProductsByCategory,
  getCompareProducts,
  getSearchProducts,
  downloadJsonTemplate,
  getStaticProductSlugs,
  jsonBulkUpload,
  getPcBuilderProducts,
  getFiltersByCategory,
};
