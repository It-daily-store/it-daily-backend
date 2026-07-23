import httpStatus from "http-status";
import config from "../../config";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { TLoginCredentials } from "./auth.interface";
import { createToken } from "./auth.utils";
import { sendEmail } from "../../utils/sendEmail";
import bcrypt from "bcrypt";
import varifyToken from "../../utils/verifyToken";
import mongoose, { Types } from "mongoose";
import { TUser } from "../user/user.interface";
import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import { EmailJobName, emailQueue } from "../../queues/email.queue";

const generateOTP = () => {
  // Declare a digits variable
  // which stores all digits
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

const adminLoginFromDB = async (payload: TLoginCredentials) => {
  const userExist = await User.isUserExistsByEmail(payload.email);

  if (!userExist) {
    throw new AppError(httpStatus.CONFLICT, "User does not exist");
  }

  if (userExist.userType !== "admin") {
    throw new AppError(httpStatus.UNAUTHORIZED, "You are not an admin");
  }

  if (userExist.isDeleted) {
    throw new AppError(httpStatus.CONFLICT, "Sorry, your account was deleted");
  }

  const matchPassword = await User.matchUserPassword(
    payload.password,
    userExist.password
  );

  if (!matchPassword) {
    throw new AppError(httpStatus.CONFLICT, "Wrong password");
  }

  const jwtPayload = {
    // userRole: userExist.role,
    email: userExist.email,
  };

  const accessToken = createToken({
    payload: jwtPayload,
    secret: config.access_secret as string,
    expiresIn: config.access_token_expires_in as string,
  });
  const refreshToken = createToken({
    payload: jwtPayload,
    secret: config.refresh_secret as string,
    expiresIn: config.refresh_token_expires_in as string,
  });

  return {
    accessToken,
    refreshToken,
    isVerified: userExist.isVerified,
  };
};

const userLoginFromDB = async (payload: TLoginCredentials) => {
  const userExist = await User.isUserExistsByEmail(payload.email);

  if (!userExist) {
    throw new AppError(httpStatus.CONFLICT, "Wrong email address");
  }

  if (userExist.role !== "customer") {
    throw new AppError(httpStatus.CONFLICT, "You are not a customer");
  }

  if (userExist.isDeleted) {
    throw new AppError(httpStatus.CONFLICT, "Sorry, your account was deleted");
  }

  const matchPassword = await User.matchUserPassword(
    payload.password,
    userExist.password
  );

  if (!matchPassword) {
    throw new AppError(httpStatus.CONFLICT, "Wrong password");
  }

  const jwtPayload = {
    email: userExist.email,
  };

  const accessToken = createToken({
    payload: jwtPayload,
    secret: config.access_secret as string,
    expiresIn: config.access_token_expires_in as string,
  });
  const refreshToken = createToken({
    payload: jwtPayload,
    secret: config.refresh_secret as string,
    expiresIn: config.refresh_token_expires_in as string,
  });

  return {
    accessToken,
    refreshToken,
    isVerified: userExist.isVerified,
  };
};

const refreshToken = async (token: string) => {
  if (!token) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized",
      "unauthorized access request"
    );
  }

  const decoded = varifyToken(token, config.refresh_secret as string);

  if (!decoded) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized",
      "unauthorized access request"
    );
  }

  const user = await User.isUserExistsByEmail(decoded.email);

  if (user.isDeleted) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Your account was deleted",
      "unauthorized access request"
    );
  }

  if (!user.isActive) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Your account is blocked",
      "unauthorized access request"
    );
  }

  const payload = {
    userRole: user.role,
    email: user.email,
  };

  const accessToken = createToken({
    payload,
    secret: config.access_secret as string,
    expiresIn: config.access_token_expires_in as string,
  });

  return {
    accessToken,
  };
};

const forgotPasswordService = async (email: string) => {
  const user = await User.isUserExistsByEmail(email);

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User does not exist");
  }

  if (!user.isVerified) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You are not verified. Please verify your email"
    );
  }

  const otpCode = generateOTP();
  const otpToken = createToken({
    payload: {
      otpCode,
      email: user.email as string,
    },
    secret: config.otp_secret as string,
    expiresIn: config.otp_expires_in as string,
  });

  await User.findByIdAndUpdate(user._id, { otp: otpToken });

  await emailQueue.add(EmailJobName.sendResetPasswordEmail, {
    user,
    opt: otpCode,
  });
};

const resetPasswordService = async (
  email: string,
  password: string,
  otp: string | undefined
) => {
  if (!otp) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Please enter opt code");
  }
  const user = await User.isUserExistsByEmail(email);

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User does not exist");
  }

  if (!user.isVerified) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You are not verified. Please verify your email first."
    );
  }

  let decoded;

  try {
    decoded = jwt.verify(user.otp, config.otp_secret as string) as JwtPayload;
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new AppError(httpStatus.FORBIDDEN, "OTP has expired");
    }
    console.log(err);
    throw new AppError(httpStatus.FORBIDDEN, "Failed to verify");
  }

  if (decoded.otpCode !== otp) {
    throw new AppError(httpStatus.CONFLICT, "OTP did not match");
  }

  if (email !== decoded.email) {
    throw new AppError(httpStatus.FORBIDDEN, "Wrong email");
  }

  const hashPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_hash_rounds)
  );

  const updatePasswordRes = await User.findOneAndUpdate(
    { email },
    { password: hashPassword }
  ).select("-password");

  return updatePasswordRes;
};

const SendVerificationEmailService = async (email: string) => {
  const user = await User.isUserExistsByEmail(email);

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User does not exist");
  }

  if (user.isVerified) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "User already verified. Please try signing in."
    );
  }

  const otpCode = generateOTP();
  const otpToken = createToken({
    payload: {
      otpCode,
      email: user.email as string,
    },
    secret: config.otp_secret as string,
    expiresIn: config.otp_expires_in as string,
  });

  await User.findByIdAndUpdate(user._id, { otp: otpToken });

  await emailQueue.add(EmailJobName.sendVerificationEmail, {
    user,
    opt: otpCode,
  });
};

const verifyEmailService = async (email: string, otp: string | undefined) => {
  if (!otp) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Verification OTP is required",
      "unauthorized access request"
    );
  }
  const user = await User.isUserExistsByEmail(email);

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User does not exist");
  }

  if (user.isVerified) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You are already verified. Please try signing in."
    );
  }

  let decoded;

  try {
    decoded = jwt.verify(user.otp, config.otp_secret as string) as JwtPayload;
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new AppError(httpStatus.FORBIDDEN, "OTP has expired");
    }
    console.log(err);
    throw new AppError(httpStatus.FORBIDDEN, "Failed to verify");
  }

  // const decoded = varifyToken(user.otp, config.otp_secret as string);

  if (decoded.otpCode !== otp) {
    throw new AppError(httpStatus.CONFLICT, "OTP did not match");
  }
  if (email !== decoded.email) {
    throw new AppError(httpStatus.FORBIDDEN, "Wrong email");
  }

  const jwtPayload = {
    // userRole: userExist.role,
    email: user.email,
  };

  const accessToken = createToken({
    payload: jwtPayload,
    secret: config.access_secret as string,
    expiresIn: config.access_token_expires_in as string,
  });
  const refreshToken = createToken({
    payload: jwtPayload,
    secret: config.refresh_secret as string,
    expiresIn: config.refresh_token_expires_in as string,
  });

  const verifiedUser = await User.findOneAndUpdate(
    { email },
    { isVerified: true, otp: "" }
  ).select("-password");

  return {
    accessToken,
    refreshToken,
    isVerified: user.isVerified,
    verifiedUser,
  };
};

const updatePasswordService = async (
  newPassword: string,
  currentPassword: string,
  email: string
) => {
  const user = await User.isUserExistsByEmail(email);

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User does not exist");
  }

  const matchPassword = await User.matchUserPassword(
    currentPassword,
    user.password
  );

  if (!matchPassword) {
    throw new AppError(httpStatus.CONFLICT, "Password does not match");
  }

  const password = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_hash_rounds)
  );

  const updated = await User.updateOne(
    { email: user.email },
    { password }
  ).select("-password");

  return updated;
};

const getMyDataFromDB = async (
  email: string,
  query: Record<string, unknown>
) => {
  let select = "";
  let populate: any = [];

  if (query.select) {
    select = query.select as string;
  } else {
    populate = [
      {
        path: "role",
      },
    ];
  }

  const result = await User.findOne({ email })
    .populate(populate)
    .select(`${select} -password -otp`);

  return result;
};

const createCustomerIntoDB = async (customer: TUser) => {
  delete customer.isDeleted;

  const user: Partial<TUser> = {
    email: customer.email,
    password: customer.password,
    userType: "customer",
    phoneNumber: customer.phoneNumber,
    name: customer.name,
  };

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const customerExist = await User.isUserExistsByEmail(customer.email);

    if (customerExist) {
      throw new AppError(
        httpStatus.CONFLICT,
        "You are already registered. Try singing in"
      );
    }

    const otpCode = generateOTP();
    const otpToken = createToken({
      payload: {
        otpCode,
        email: user.email as string,
      },
      secret: config.otp_secret as string,
      expiresIn: config.otp_expires_in as string,
    });

    user.otp = otpToken;

    const userRes = await User.create(user);

    if (!userRes) {
      throw new AppError(httpStatus.CONFLICT, "failed to register account");
    }

    await emailQueue.add(EmailJobName.sendVerificationEmail, {
      opt: otpCode,
      user,
    });

    await session.commitTransaction();
    await session.endSession();
    return {
      user: userRes,
      verficationSent: true,
    };
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(
      httpStatus.CONFLICT,
      err instanceof AppError ? err?.message : "Failed to create user"
    );
  }
};

const updateMyProfileToDB = async (data: TUser, user: Types.ObjectId) => {
  try {
    const { name, address, phoneNumber, profilePicture } = data;

    const result = await User.findByIdAndUpdate(user, {
      name,
      address,
      profilePicture,
      phoneNumber,
    });

    return result;
  } catch (err) {
    throw new AppError(
      httpStatus.CONFLICT,
      err instanceof AppError ? err?.message : "Failed to update profile"
    );
  }
};

export const AuthServices = {
  adminLoginFromDB,
  refreshToken,
  getMyDataFromDB,
  forgotPasswordService,
  resetPasswordService,
  SendVerificationEmailService,
  verifyEmailService,
  updatePasswordService,
  userLoginFromDB,
  createCustomerIntoDB,
  updateMyProfileToDB,
};
