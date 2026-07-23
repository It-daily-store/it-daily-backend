import mongoose, { Types } from "mongoose";
import { IDeal } from "./deals.interface";
import Deal from "./deals.model";
import redisClient from "../../../redis";
import { RedisKeys } from "../../interface/common";
import { TProduct } from "../product/product.interface";
import { Product } from "../product/product.model";
import { ObjectId } from "mongodb";
import { setProductsToRedis } from "../product/product.redis";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { DealJobName, dealQueue } from "./deal.queue";
import sift from "sift";
import { ProductJobName, productQueue } from "../product/product.queue";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

function toUTC(dateStr: string) {
  const date = new Date(dateStr);
  // Date object stores UTC internally
  return date.toISOString(); // always in UTC
}

const createDealToDb = async (data: Partial<IDeal>, user: Types.ObjectId) => {
  const payload: Partial<IDeal> = {
    title: data.title,
    description: data.description,
    endTime: data.endTime ? toUTC(data.endTime) : undefined,
    startTime: data.startTime ? toUTC(data.startTime) : undefined,
    image: data.image,
    createdBy: user,
    lastUpdatedBy: user,
    isActive: false,
  };

  const result = await Deal.create(payload);

  await dealQueue.add(DealJobName.updateAllDeals, {});

  return result;
};

const addProductsToDealToDB = async (
  data: IDeal["products"],
  user: Types.ObjectId,
  deal: string
) => {
  const dealExist = await Deal.findById(deal);

  if (!dealExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Could not find deal");
  }

  if (new Date(dealExist.endTime) < new Date()) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Deal has already ended. cannot add product now"
    );
  }

  const existingProductIds = dealExist.products.map((p) =>
    p.productId.toString()
  );

  const newProductsOnly = data.filter(
    (reqProduct) =>
      !existingProductIds.includes(reqProduct.productId.toString())
  );

  if (newProductsOnly.length === 0) {
    throw new AppError(httpStatus.CONFLICT, "Found no new products to add");
  }

  let products: IDeal["products"] = [];
  let notFoundProducts = 0;

  const redisData = await redisClient.get(RedisKeys.products);

  if (redisData !== null) {
    const redisProducts = JSON.parse(redisData);
    for (const reqProduct of newProductsOnly) {
      const exist = redisProducts.find(
        (p: TProduct) => p._id.toString() === reqProduct.productId.toString()
      );
      if (exist) {
        products.push(reqProduct);
      } else {
        notFoundProducts++;
      }
    }
  } else {
    const databaseProducts = await Product.find({
      _id: { $in: newProductsOnly.map((p) => new ObjectId(p.productId)) },
    }).lean();
    for (const reqProduct of newProductsOnly) {
      const exist = databaseProducts.find(
        (p: TProduct) => p._id.toString() === reqProduct.productId.toString()
      );
      if (exist) {
        products.push(reqProduct);
      } else {
        notFoundProducts++;
      }
    }
    await setProductsToRedis();
  }

  if (products.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "No valid new products to add");
  }

  // Append new valid products to existing ones
  const updatedProducts = [...dealExist.products, ...products];

  const result = await Deal.findByIdAndUpdate(
    deal,
    { products: updatedProducts, lastUpdatedBy: user },
    { new: true }
  );

  await dealQueue.add(DealJobName.updateAllDeals, {});
  await productQueue.add(ProductJobName.updateAllProducts, {});

  return {
    products: result?.products,
    notFoundProducts,
    addedProducts: products.length,
  };
};

const getAllDealsFromDB = async (query: {
  page: string;
  limit: string;
  search: string;
}) => {
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 20;
  const skip = (page - 1) * limit;

  const seachQuery: Record<string, any> = {};

  if (query.search !== "") {
    seachQuery["title"] = { $regex: query.search, $options: "i" };
  }

  const catchData = await redisClient.get(RedisKeys.deals);
  let total = 0;
  let result: IDeal[] = [];
  if (catchData !== null) {
    const data = JSON.parse(catchData) || [];
    const filteredData = data.filter(sift(seachQuery)) || [];
    total = filteredData.length;
    result = filteredData?.slice(skip, skip + limit);
  } else {
    result = await Deal.find(seachQuery)
      .populate([
        {
          path: "products.productId",
          select: "slug name thumbnail price mainCategory",
        },
        {
          path: "createdBy",
          select: "fullName profilePicture email role",
          populate: {
            path: "role",
            select: "role",
          },
        },
        {
          path: "lastUpdatedBy",
          select: "fullName profilePicture email role",
          populate: {
            path: "role",
            select: "role",
          },
        },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    total = Number(Deal.countDocuments(seachQuery));

    await dealQueue.add(DealJobName.updateAllDeals, {});
  }

  return {
    deals: result,
    pagination: {
      total,
      currentPage: page,
      limit,
    },
  };
};

const getDealByIdFromDB = async (id: string) => {
  const deal = await Deal.findById(id).populate(
    "products.productId",
    "name slug thumbnail price discount"
  );

  if (!deal) {
    throw new AppError(httpStatus.NOT_FOUND, "Could not find deal");
  }

  return deal;
};

const getProductsForDealFromDB = async (
  id: string,
  query: Record<string, any>
) => {
  const page = query?.page ? Number(query.page) : 1;
  const limit = query?.limit ? Number(query.limit) : 20;
  const skip = (page - 1) * limit;
  // let deal: IDeal | null;
  let products: Partial<TProduct>[] = [];
  let conflictingDeals: any[] = [];
  let total = 0;

  const deal = await Deal.findById(id);
  if (!deal) {
    throw new AppError(httpStatus.CONFLICT, "Could not find");
  }

  if (new Date(deal.endTime) < new Date()) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Deal has ended cannot add product"
    );
  }

  conflictingDeals = await Deal.find({
    _id: { $ne: id },
    isActive: true,
    $or: [
      {
        startTime: { $lte: deal.endTime },
        endTime: { $gte: deal.startTime },
      },
    ],
  }).lean();

  const conflictingProductIds = conflictingDeals
    .flatMap((d: any) => d.products.map((p: any) => p.productId))
    .filter(Boolean);
  const currentDealProductIds = deal.products
    .map((p: any) => p.productId)
    .filter(Boolean);

  const dbQuery: Record<string, any> = {
    _id: {
      $nin: [...currentDealProductIds, ...conflictingProductIds],
    },
    isPublished: true,
    isDeleted: false,
  };

  if (query.search) {
    dbQuery["name"] = { $regex: query.search, $options: "i" };
  }

  products = await Product.find(dbQuery)
    .select("name slug _id mainCategory createdBy thumbnail")
    .populate("mainCategory", "name slug") // Adjust fields as needed
    .populate("createdBy", "name email") // Adjust fields as needed
    .skip(skip)
    .limit(limit)
    .lean();

  total = await Product.countDocuments(dbQuery);

  return {
    products,
    pagination: {
      currentPage: page,
      limit: limit,
      total,
    },
  };
};

const updateDealToDB = async (
  id: string,
  user: Types.ObjectId,
  data: Partial<IDeal>
) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(httpStatus.NOT_FOUND, "Could not find deal");
  }

  const { title, description, startTime, endTime, image } = data;

  let deal: IDeal | null;

  const redisDeals = await redisClient.get(RedisKeys.deals);

  if (redisDeals !== null) {
    const deals = JSON.parse(redisDeals);
    deal = deals.find((d: IDeal) => d._id.toString() === id);
  } else {
    deal = await Deal.findById(id);
    await dealQueue.add(DealJobName.updateAllDeals, {});
  }

  if (!deal) {
    throw new AppError(httpStatus.NOT_FOUND, "Could not find deal");
  }

  const now = dayjs().utc();
  if (startTime) {
    const newStartTime = dayjs(startTime).utc();
    const dealStartTime = dayjs(deal.startTime).utc();
    const newEndTime = endTime
      ? dayjs(endTime).utc()
      : dayjs(deal.endTime).utc();

    if (newStartTime.isAfter(newEndTime)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Start date cannot be before end date and time"
      );
    }

    if (newStartTime.isBefore(now)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot set past date as start date and time"
      );
    }

    if (deal.isActive && !newStartTime.isSame(dealStartTime, "minute")) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot change start time of an active deal"
      );
    }
  }

  if (endTime) {
    const newStartTime = startTime
      ? dayjs(startTime).utc()
      : dayjs(deal.startTime).utc(); // string in UTC
    const newEndTime = dayjs(endTime).utc();

    if (newEndTime.isBefore(now)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot set past date as end date and time"
      );
    }
    if (newEndTime.isBefore(newStartTime)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "End date cannot be before start date and time"
      );
    }
  }

  const result = await Deal.findByIdAndUpdate(
    id,
    {
      title,
      description,
      image,
      lastUpdatedBy: user,
      startTime,
      endTime,
    },
    { new: true }
  );

  await dealQueue.add(DealJobName.updateAllDeals, {});

  return result;
};

// }
export const DealsServices = {
  createDealToDb,
  addProductsToDealToDB,
  getAllDealsFromDB,
  getDealByIdFromDB,
  getProductsForDealFromDB,
  updateDealToDB,
};
