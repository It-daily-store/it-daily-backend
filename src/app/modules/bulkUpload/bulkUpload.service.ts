import BulkUpload from "./bulkUpload.model"

const getBulkUploadHistoryFromDB = async () => {
    const result = await BulkUpload.aggregate([
        {
            $addFields: {
                totalUploads: {
                    $add: [{$size: '$withError'}, {$size: '$successData'}]
                }
            }
        },
        {
            $lookup: {
                from: 'users',
                foreignField: '_id',
                localField: 'createdBy',
                as: 'createdBy'
            }
        },
        {
            $unwind: '$createdBy'
        }
    ])
    return result
}

export const BulkUploadHistoryServices = {
    getBulkUploadHistoryFromDB
}