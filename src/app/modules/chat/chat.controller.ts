import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ChatServices } from "./chat.service";

const createChat = catchAsync(async (req, res) => {
  const payload = req.body;
  const userData = req.user.userData;

  const result = ChatServices.createChatIntoDB(payload, userData);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Chat created successfully",
    data: result,
  });
});

export const ChatControllers = { createChat };
