import { Types } from "mongoose";
import QueryBuilder from "../../builder/queryBuilder";
import { TPagination } from "../product/product.interface";
import { TNotification } from "./notification.interface";
import Notification from "./notification.model";
import { ObjectId } from "mongodb";
import { deriveNotificationText } from "./notificaiton.utils";
import { Roles } from "../roles/roles.model";

// userFrom/userTo arrive populated at runtime, so they stay loose here.
type TLeanNotification = Omit<TNotification, "userFrom" | "userTo"> & {
  _id: Types.ObjectId;
  userFrom: unknown;
  userTo: unknown;
  createdAt: Date;
  updatedAt: Date;
};

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * User.role is a String path holding either a Roles id (admins) or the literal
 * "customer" sentinel, so Mongoose populate throws a CastError on customers —
 * which order notifications always have as userFrom. Resolve it separately.
 */
const attachActorRoles = async (notifications: TLeanNotification[]) => {
  const actors = notifications
    .map((noti) => noti.userFrom)
    .filter(
      (actor): actor is { role?: unknown } =>
        !!actor && typeof actor === "object"
    );

  const roleIds = [
    ...new Set(
      actors
        .map((actor) => actor.role)
        .filter(
          (role): role is string =>
            typeof role === "string" && objectIdPattern.test(role)
        )
    ),
  ];

  const roleDocs = roleIds.length
    ? await Roles.find({ _id: { $in: roleIds } })
        .select("role")
        .lean()
    : [];

  const roleNames = new Map(
    roleDocs.map((doc) => [String(doc._id), doc.role])
  );

  for (const actor of actors) {
    if (typeof actor.role !== "string") continue;

    actor.role = {
      role: objectIdPattern.test(actor.role)
        ? roleNames.get(actor.role) || null
        : actor.role,
    };
  }
};

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

  const notifications = await notificationQuery.modelQuery
    .populate([
      {
        path: "userTo",
        select: "name fullName role email profilePicture",
      },
      {
        path: "userFrom",
        select: "name fullName role email profilePicture",
      },
    ])
    .lean<TLeanNotification[]>();

  await attachActorRoles(notifications);

  const result = notifications.map((noti) => ({
    ...noti,
    text: deriveNotificationText(noti),
  }));

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
