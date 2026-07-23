import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { GalleryFolderService } from "./gallery.service";

const createGalleryFolder = catchAsync(async (req, res) => {
    const { parent_id, name } = req.body

    const result = await GalleryFolderService.createGalleryFolderIntoDB({ parent_id, name })

    sendResponse(res,
        {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Created new folder',
            data: result
        }
    )
})

const getFolders = catchAsync(async (req, res) => {

    const parent_id = req.query.parent_id as string

    const result = await GalleryFolderService.getFoldersFromDB(parent_id)

    sendResponse(res,
        {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Successfully retrived folders',
            data: result
        }
    )
})

const updateFolder = catchAsync(async (req, res) => {
    const id = req.params.id
    const { name } = req.body

    const result = await GalleryFolderService.updateFolderIntoDB(id, name)

    sendResponse(res,
        {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Successfully updated folder',
            data: result
        }
    )
})

const deleteFolder = (catchAsync(async (req, res) => {
    const id = req.params.id
    const result = await GalleryFolderService.deleteFolderFromDB(id)

    sendResponse(res,
        {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Successfully deleted folder',
            data: result
        }
    )
}))


export const GalleryFolderController = {
    createGalleryFolder,
    getFolders,
    updateFolder,
    deleteFolder
}