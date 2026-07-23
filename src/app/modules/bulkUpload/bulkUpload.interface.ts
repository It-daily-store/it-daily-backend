import { ObjectId } from "mongodb"
import { TErrorSourse } from "../../interface/error.interface"
import { TProduct } from "../product/product.interface"
import { Types } from "mongoose"

export type TWithError = { name: string, errorSources: TErrorSourse, data: TProduct }
export type TSuccessData = { name: string, slug: string, sku: string, _id: Types.ObjectId }

export type TBulkUploadData = {
    withError: TWithError[],
    successData: TSuccessData[],
    createdBy: Types.ObjectId
}