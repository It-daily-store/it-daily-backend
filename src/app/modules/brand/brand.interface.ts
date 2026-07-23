import { Model } from "mongoose"

export type TBrand = {
    _id: string,
    name: string,
    image: string,
    isDeleted: boolean,
    isActive: boolean,
    createdBy: string
}

export interface TBrandModel extends Model<TBrand> {
    findBrandByName(name: string): Promise<boolean>,
    findBrandById(id: string): Promise<TBrand | undefined>
}
