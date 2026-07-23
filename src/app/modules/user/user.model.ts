import { model, Schema } from "mongoose";
import { TAddress, TName, TUser, TUserModel } from "./user.interface";
import bcrypt from "bcrypt";
import config from "../../config";
import { boolean } from "zod";

const NameSchema = new Schema<TName>({
  firstName: { type: String, required: [true, "First name is required"] },
  middleName: { type: String, default: "" },
  lastName: { type: String, required: [true, "Last name is required"] },
});

const AddressSchema = new Schema<TAddress>({
  street: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  postalCode: { type: String, default: "" },
  country: { type: String, default: "" },
});

const UserSchema = new Schema<TUser, TUserModel>({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    required: [true, "Role is required"],
    default: "customer",
    ref: "Roles",
  },
  phoneNumber: {
    type: String,
    require: [true, "Phone number is required"],
    default: "",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isMasterAdmin: {
    type: Boolean,
  },
  otp: {
    type: String,
    default: "",
  },
  passwordChangedAt: {
    type: String,
  },
  address: {
    type: AddressSchema,
    default: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
  },
  userType: {
    type: String,
    enum: ["customer", "admin"],
    default: "customer",
  },
  name: {
    type: NameSchema,
    required: [true, "Name is required"],
  },
  profilePicture: {
    type: String,
    default: "",
  },
});

UserSchema.pre("save", async function (next) {
  const user = this;

  user.password = await bcrypt.hash(
    user.password,
    Number(config.bcrypt_hash_rounds)
  );

  next();
});

UserSchema.post("save", async function (doc, next) {
  doc.password = "";
  next();
});

UserSchema.virtual("fullName").get(function () {
  if (!this.name) return;
  const { firstName, middleName, lastName } = this.name;
  return [firstName, middleName, lastName].filter(Boolean).join(" ");
});

UserSchema.statics.findAllVerifiedAdmins = async () => {
  const result = await User.find({
    isDeleted: false,
    role: { $ne: "customer" },
    userType: { $eq: "admin" },
  }).select("name fullName email role _id profilePicture isActive isVerified");

  return result;
};

UserSchema.set("toJSON", {
  virtuals: true,
});

// ================== static methods ==================
UserSchema.statics.isUserExistsByEmail = async function (email, lean) {
  if (lean) {
    return await User.findOne({ email }).select("-otp -password").lean();
  } else {
    return await User.findOne({ email });
  }
};

UserSchema.statics.isUserVarified = async function (email: string) {
  const exist = await User.isUserExistsByEmail(email);
  if (exist) {
    return exist.isVerified;
  } else {
    return false;
  }
};

UserSchema.statics.findUserRoleByEmail = async function (email) {
  const exist = await User.isUserExistsByEmail(email);

  if (exist) {
    return exist.role;
  } else {
    return null;
  }
};

UserSchema.statics.matchUserPassword = async function (
  userPassword,
  databasePassword
) {
  return await bcrypt.compare(userPassword, databasePassword);
};

export const User = model<TUser, TUserModel>("User", UserSchema);
