import redisClient from "../../../redis";
import { RedisKeys } from "../../interface/common";
import { IDeal } from "./deals.interface";
import Deal from "./deals.model";

const DEAL_TTL = 10800;

export const setDealsToRedis = async () => {
  try {
    const deals = await Deal.find().populate([
      {
        path: "products.productId",
        select: "name slug thumbnail price",
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
    ]);

    if (deals) {
      await redisClient.setex(RedisKeys.deals, DEAL_TTL, JSON.stringify(deals));
    }
  } catch (err) {
    console.log(err);
  }
};

export const updateSingleDealInRedis = async (id: string) => {
  let deal: IDeal | null;

  const catchData = await redisClient.get(RedisKeys.deals);
  if (catchData !== null) {
    deal = JSON.parse(catchData)?.find((d: IDeal) => d._id.toString() === id);
  } else {
    deal = await Deal.findById(id);
  }

  if (!deal) {
    return console.log("deal not found to update redis");
  }
};
