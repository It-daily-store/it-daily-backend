import { model, Schema } from "mongoose";
import { TGalleryFolder } from "./gallery.interface";

const GalleryFolderSchema = new Schema<TGalleryFolder>({
    name: {
        type: String,
        required: [true, "Folder name is required"]
    },
    parent_id: {
        type: String,
        default: null,
        ref: "GalleryFolder"
    }
})


export const GalleryFolder = model<TGalleryFolder>('GalleryFolder', GalleryFolderSchema)