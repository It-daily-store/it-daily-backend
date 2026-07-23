import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ImageUploadServices } from "./image.service";

const uploadImage = catchAsync(async (req, res) => {

    const { type } = req.body
    const folder = req.body.folder || null

    const result = await ImageUploadServices.uploadImageIntoDB(req.files as Express.Multer.File[], type, folder)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Images upload successfully",
        data: result
    })
})


const getAllImages = catchAsync(async (req, res) => {

    const folder = req.query.folder as string

    const result = await ImageUploadServices.getAllImagesFromDB(folder)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Retrived images successfully",
        data: result
    })
})

const deleteImages = catchAsync(async (req, res) => {
    const { public_ids, database_ids } = req.body

    const result = await ImageUploadServices.deleteImagesFromDB({ public_ids, database_ids })

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Successfully deleted image(s)",
        data: result
    })
})

export const ImageUploadController = {
    uploadImage,
    getAllImages,
    deleteImages
}