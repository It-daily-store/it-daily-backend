import { getIO } from "../../../socket";
import { makeFullName } from "../../utils/makeFullName";
import { TUser } from "../user/user.interface";
import { User } from "../user/user.model";
import {
  TNotification,
  TNotificationAction,
  TNotificationMeta,
  TNotificationType,
} from "./notification.interface";
import Notification from "./notification.model";
import { ObjectId } from "mongodb";

export const buildNotifications = async ({
  thisUser,
  source,
  notificationType,
  actionType,
  meta,
}: {
  thisUser: TUser;
  source: ObjectId | string;
  notificationType: TNotificationType;
  actionType: TNotificationAction;
  meta?: TNotificationMeta;
}): Promise<TNotification[]> => {
  const admins = await User.findAllVerifiedAdmins();

  return admins.map((admin) => ({
    notificationType,
    actionType,
    opened: false,
    userFrom: thisUser?._id,
    userTo: admin?._id,
    source: String(source),
    ...(meta && { meta }),
  }));
};

export const addNotifications = async ({
  notifications,
  userFrom,
}: {
  notifications: TNotification[];
  userFrom?: TUser;
}) => {
  const io = getIO();
  if (notifications && notifications.length > 0) {
    for (const noti of notifications) {
      try {
        const res = (await Notification.create(noti)).toObject();
        io.to(`${noti?.userTo.toString()}`).emit("newNotification", {
          ...res,
          userFrom: userFrom,
        });
      } catch (err) {
        console.log(err);
      }
    }
  }
};

const entityLabels: Record<TNotificationType, string> = {
  order: "order",
  address: "address",
  gallery: "gallery folder",
  role: "role",
  product: "product",
  productDetails: "details category",
  category: "category",
  photo: "photo",
  user: "user",
  brand: "brand",
  bulkUpload: "bulk upload",
  productFilter: "product filter",
};

const actionVerbs: Record<TNotificationAction, string> = {
  create: "created",
  update: "updated",
  delete: "deleted",
};

const resolveId = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
};

const resolveActorName = (userFrom: unknown): string => {
  if (userFrom && typeof userFrom === "object") {
    const actor = userFrom as { fullName?: string; name?: TUser["name"] };
    if (actor.fullName) return actor.fullName;
    if (actor.name) return makeFullName(actor.name);
  }
  return "Someone";
};

/**
 * Back-compat only: the customer-facing homepage still reads a flat `text`
 * field. Derived per request and never persisted — delete once that app builds
 * its own message the way the admin dashboard now does.
 */
export const deriveNotificationText = (noti: {
  notificationType: TNotificationType;
  actionType: TNotificationAction;
  userFrom?: unknown;
  userTo?: unknown;
  source?: string;
  meta?: TNotificationMeta;
}): string => {
  const isSelf =
    !!noti.userFrom &&
    resolveId(noti.userFrom) === resolveId(noti.userTo);
  const actor = isSelf ? "You" : resolveActorName(noti.userFrom);
  const verb = actionVerbs[noti.actionType] || noti.actionType;
  const label = entityLabels[noti.notificationType] || "record";

  if (noti.notificationType === "order") {
    // Pre-meta rows still carry the order number in `source`.
    const orderNumber = noti.meta?.orderNumber || noti.source;
    const orderRef = orderNumber ? `order #${orderNumber}` : "an order";

    if (noti.actionType === "create") {
      return `${actor} placed ${orderRef}`;
    }
    if (noti.meta?.orderStatus) {
      return `${actor} moved ${orderRef} to ${noti.meta.orderStatus}`;
    }
    return `${actor} updated ${orderRef}`;
  }

  return noti.meta?.entityName
    ? `${actor} ${verb} ${label} ${noti.meta.entityName}`
    : `${actor} ${verb} a ${label}`;
};
