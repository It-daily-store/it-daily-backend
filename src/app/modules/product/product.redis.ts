import { Types } from "mongoose";
import redisClient from "../../../redis";
import { RedisKeys } from "../../interface/common";
import { TProduct } from "./product.interface";
import { Product } from "./product.model";

const EXPIRE_TIME = 86400;

export const getProductsFromRedis = async (): Promise<TProduct[]> => {
  const data = await redisClient?.get(RedisKeys.products);
  if (data) {
    return JSON.parse(data);
  } else {
    return [];
  }
};

export const setProductsToRedis = async () => {
  try {
    const res = await Product.find().populate([
      {
        path: "mainCategory",
        select: "_id name slug image",
      },
      {
        path: "brand",
      },
      {
        path: "createdBy",
        select: "role fullName name profilePicture email",
        populate: [
          {
            path: "role",
            select: "role",
          },
        ],
      },
    ]);

    await redisClient.setex(
      RedisKeys.products,
      EXPIRE_TIME,
      JSON.stringify(res)
    );
  } catch (err) {
    console.log("Error saving products to redis", { error: err });
  }
};

export const updateSigleProductToRedis = async (
  id: Types.ObjectId,
  type: "update" | "delete"
) => {
  try {
    const product = await Product.findById(id).populate([
      {
        path: "mainCategory",
      },
      {
        path: "brand",
      },
    ]);

    if (product) {
      let products: TProduct[] = [];

      const redisData = await redisClient.get(RedisKeys.products);
      if (redisData) {
        products = JSON.parse(redisData);

        const updatedProduct =
          type === "delete"
            ? products.filter((p) => p._id !== id)
            : products?.map((p) => {
                if (p._id.toString() === product._id.toString()) {
                  return product;
                } else {
                  return p;
                }
              });

        await redisClient.setex(
          RedisKeys.products,
          EXPIRE_TIME,
          JSON.stringify(updatedProduct)
        );
      } else {
        await setProductsToRedis();
      }
    }
  } catch (err) {
    console.log(err);
  }
};
