import { getIO } from "../../../socket";
import { makeFullName } from "../../utils/makeFullName";
import { TUser } from "../user/user.interface";
import { User } from "../user/user.model";
import { TNotification } from "./notification.interface";
import Notification from "./notification.model";
import { ObjectId } from "mongodb";

export const buildNotifications = async ({
  thisUser,
  source,
  notificationType,
  actionType,
  text,
}: {
  thisUser: TUser;
  source: ObjectId | string;
  text: string;
  notificationType: TNotification["notificationType"];
  actionType: TNotification["actionType"];
}): Promise<TNotification[]> => {
  const admins = await User.findAllVerifiedAdmins();
  const notifications: TNotification[] = admins.map((admin) => {
    const notification: TNotification = {
      notificationType: notificationType,
      actionType: actionType,
      opened: false,
      userFrom: thisUser?._id,
      userTo: admin?._id,
      source: String(source),
      text: `${
        String(admin._id) === String(thisUser?._id)
          ? "You"
          : makeFullName(thisUser.name)
      } ${text}`,
    };

    return notification;
  });

  return notifications;
};

export const addNotifications = async ({
  notifications,
  rooms,
  ignoreRooms,
  userFrom,
}: {
  notifications: TNotification[];
  rooms?: string[];
  ignoreRooms?: string[];
  userFrom?: TUser;
}) => {
  const io = getIO();
  if (notifications && notifications.length > 0) {
    for (const noti of notifications) {
      try {
        const res = (await Notification.create(noti)).toObject();
        console.log(noti.userTo);
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
