import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { NotificationService } from "./notification.service";

const getMyNotifications = catchAsync(async (req, res) => {
  const user = req.user.userData._id;
  const query = req.query;
  const result = await NotificationService.getMyNotificationsFromDB(
    user,
    query
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Fetched my notificatins",
    data: result.data,
    pagination: result.pagination,
  });
});

export const NotificationContoller = { getMyNotifications };
