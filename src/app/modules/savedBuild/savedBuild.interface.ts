import { Types } from "mongoose";

export interface ISavedBuildPart {
  partId: number;
  name: string;
  category?: Types.ObjectId | string;
  isRequired: boolean;
  product: Types.ObjectId;
}

export interface ISavedBuild {
  user: Types.ObjectId;
  name: string;
  parts: ISavedBuildPart[];
}
