import { z } from "zod";

const createGalleryFolderValidationSchema = z.object({
    name: z.string({ required_error: 'Folder name is required' }),
    parent_id: z.string().nullable().optional()
})


export const GalleryFolderValidatonSchema = { createGalleryFolderValidationSchema }