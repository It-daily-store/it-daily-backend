import { Model, Types } from "mongoose";

export interface TName {
  firstName: string;
  middleName?: string;
  lastName: string;
}

export interface TAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface TUser {
  _id: Types.ObjectId;
  password: string;
  isActive?: boolean;
  role: "customer" | string;
  isVerified?: boolean;
  userType: "customer" | "admin";
  isMasterAdmin?: boolean;
  phoneNumber: string;
  otp: string;
  passwordChangedAt?: string;
  name: TName;
  email: string;
  address?: TAddress;
  profilePicture?: string;
  isDeleted?: boolean;
}

export interface TUserModel extends Model<TUser> {
  isUserExistsByEmail(email: string, lean?: boolean): Promise<TUser>;
  isUserVarified(email: string): Promise<boolean>;
  findUserRoleByEmail(email: string): Promise<string>;
  findAllVerifiedAdmins(): Promise<TUser[]>;
  matchUserPassword(
    userPassword: string,
    databasePassword: string
  ): Promise<boolean>;
}
