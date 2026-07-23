import { GalleryFolder } from "./gallery.model";
import { TGalleryFolder } from "./gallery.interface";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { Image } from "../Images/image.model";

const createGalleryFolderIntoDB = async (payload: TGalleryFolder) => {

    let parent_id: string | null = payload.parent_id || null

    if (payload.parent_id) {
        const exist = await GalleryFolder.findById(payload.parent_id)

        if (!exist) {
            throw new AppError(httpStatus.CONFLICT, 'parent does not exist')
        }
    }

    const result = await GalleryFolder.create({ name: payload.name, parent_id })

    return result
}

const getFoldersFromDB = async (folder: string | null) => {

    const parent_id = folder || null

    const result = await GalleryFolder.find({ parent_id })

    return result
}


const updateFolderIntoDB = async (id: string, name: string) => {
    const exist = await GalleryFolder.findById(id)

    if (!exist) {
        throw new AppError(httpStatus.CONFLICT, 'folder does not exist')
    }

    const result = await GalleryFolder.findByIdAndUpdate(id, { name }, { new: true })

    return result
}

const deleteFolderFromDB = async (id: string) => {
    const hasFolder = await GalleryFolder.findOne({ parent_id: id })
    if (hasFolder) {
        throw new AppError(httpStatus.FORBIDDEN, 'Unable to delete the folder because it contains subfolders.')
    }
    const hasImages = await Image.findOne({ folder: id })
    if (hasImages) {
        throw new AppError(httpStatus.FORBIDDEN, 'Unable to delete the folder because it contains images.')
    }

    const result = await GalleryFolder.findByIdAndDelete(id)

    return result
}


export const GalleryFolderService = { createGalleryFolderIntoDB, getFoldersFromDB, updateFolderIntoDB, deleteFolderFromDB }