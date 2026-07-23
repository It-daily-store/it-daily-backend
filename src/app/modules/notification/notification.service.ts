import { Types } from "mongoose";
import QueryBuilder from "../../builder/queryBuilder";
import { TPagination } from "../product/product.interface";
import { TNotification } from "./notification.interface";
import Notification from "./notification.model";
import { ObjectId } from "mongodb";

const addNotificationToDB = async (payload: TNotification) => {
  const result = await Notification.create(payload);
  return result;
};

const getMyNotificationsFromDB = async (
  user: Types.ObjectId,
  query: Record<string, unknown>
) => {
  const unreadCount = await Notification.countDocuments({
    userTo: new ObjectId(user),
    opened: false,
  });

  const total = await Notification.countDocuments({
    userTo: new ObjectId(user),
  });

  const newQuery = {
    page: Number(query.page) || 1,
    limit: Number(query.limit) || 20,
  };

  const notificationQuery = new QueryBuilder(
    Notification.find({ userTo: new ObjectId(user) }),
    newQuery
  ).sort();

  await notificationQuery.paginate();

  const result = await notificationQuery.modelQuery.populate([
    {
      path: "userTo",
      select: "name fullName role email profilePicture",
      // populate: [
      //   {
      //     path: "role",
      //     select: "role",
      //   },
      // ],
    },
    {
      path: "userFrom",
      select: "name fullName role email profilePicture",
      // populate: [
      //   {
      //     path: "role",
      //     select: "role",
      //   },
      // ],
    },
  ]);

  const pagination: TPagination = {
    currentPage: newQuery.page,
    limit: newQuery.limit,
    hasMore: result.length === newQuery.limit,
    total,
  };

  return {
    data: {
      notifications: result,
      unreadCount,
    },
    pagination,
  };
};
export const NotificationService = {
  addNotificationToDB,
  getMyNotificationsFromDB,
};
