import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BulkUploadHistoryServices } from "./bulkUpload.service";

const getBulkUploadHistory = catchAsync(async (req, res) => {
    const result = await BulkUploadHistoryServices.getBulkUploadHistoryFromDB()

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Retrived upload history data successfully',
        data: result
    })
})

export const BulkUploadHistoryController = {
    getBulkUploadHistory
}