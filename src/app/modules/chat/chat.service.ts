import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { TUser } from "../user/user.interface";
import { Chat } from "./chat.model";

const createChatIntoDB = async (payload: TChat, user: TUser) => {
  if (!user) {
    throw new AppError(httpStatus.FORBIDDEN, "Creator information is missing");
  }

  const result = await Chat.create({
    ...payload,
    createdBy: user._id,
  });
  return result;
};

export const ChatServices = { createChatIntoDB };
