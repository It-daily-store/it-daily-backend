"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ErrorSourceSchema = new mongoose_1.Schema({
    path: { type: [String, Number] },
    message: { type: String }
});
const WithErrorSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    errorSources: { type: [ErrorSourceSchema], required: true },
    data: { type: mongoose_1.Schema.Types.Mixed, required: true },
});
// Define the SuccessData schema
const SuccessDataSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true },
    sku: { type: String, required: true },
    _id: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "Product" },
});
const BulkUploadSchema = new mongoose_1.Schema({
    withError: [WithErrorSchema],
    successData: [SuccessDataSchema],
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});
const BulkUpload = (0, mongoose_1.model)('bulkUpload', BulkUploadSchema);
exports.default = BulkUpload;
