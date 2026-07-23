// import { FilterQuery } from "mongoose";
// import { TGalleryFolder } from "./gallery.interface";


// export const generateFolderTree = (folders: FilterQuery<TGalleryFolder[]>, parent = null) => {
//     const tree: TGalleryFolder[] = []

//     let filteredFolders = []
//     if (parent === null) {
//         filteredFolders = folders.filter(item => item.parent_id === null)
//     }
//     else {
//         filteredFolders = folders.filter(item => item.parent_id === parent)
//     }

//     if (filteredFolders.length > 0) {
//         for (const folder of filteredFolders) {
//             tree.push(
//                 {
//                     name: folder.name,
//                     parent_id: folder.parent_id,
//                     _id: folder._id,
//                     subFolders: generateFolderTree(folders, folder.id)
//                 }
//             )
//         }
//     }

//     return tree
// }