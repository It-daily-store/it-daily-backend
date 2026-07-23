import { model, Schema } from "mongoose";
import { TBulkUploadData } from "./bulkUpload.interface";

const ErrorSourceSchema = new Schema(
    {
        path: { type: [String, Number] },
        message: { type: String }
    }
)

const WithErrorSchema = new Schema({
    name: { type: String, required: true },
    errorSources: { type: [ErrorSourceSchema], required: true },
    data: { type: Schema.Types.Mixed, required: true },
});

// Define the SuccessData schema
const SuccessDataSchema = new Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true },
    sku: { type: String, required: true },
    _id: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
});

const BulkUploadSchema = new Schema<TBulkUploadData>({
    withError: [WithErrorSchema],
    successData: [SuccessDataSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
})

const BulkUpload = model<TBulkUploadData>('bulkUpload', BulkUploadSchema)

export default BulkUpload