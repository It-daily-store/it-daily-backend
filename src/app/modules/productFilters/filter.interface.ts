import { Model } from "mongoose";

export interface TProductFilter {
  filterId: number;
  title: string;
  options: {
    optionId: string;
    value: string;
  }[];
}

export interface TFilterModel extends Model<TProductFilter> {
  findFilterById: (id: string) => Promise<TProductFilter>;
}
