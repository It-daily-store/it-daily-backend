"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../../config"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const user_model_1 = require("../user/user.model");
const auth_utils_1 = require("./auth.utils");
const bcrypt_1 = __importDefault(require("bcrypt"));
const verifyToken_1 = __importDefault(require("../../utils/verifyToken"));
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const email_queue_1 = require("../../queues/email.queue");
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
const adminLoginFromDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const userExist = yield user_model_1.User.isUserExistsByEmail(payload.email);
    if (!userExist) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "User does not exist");
    }
    if (userExist.userType !== "admin") {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are not an admin");
    }
    if (userExist.isDeleted) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Sorry, your account was deleted");
    }
    const matchPassword = yield user_model_1.User.matchUserPassword(payload.password, userExist.password);
    if (!matchPassword) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Wrong password");
    }
    const jwtPayload = {
        // userRole: userExist.role,
        email: userExist.email,
    };
    const accessToken = (0, auth_utils_1.createToken)({
        payload: jwtPayload,
        secret: config_1.default.access_secret,
        expiresIn: config_1.default.access_token_expires_in,
    });
    const refreshToken = (0, auth_utils_1.createToken)({
        payload: jwtPayload,
        secret: config_1.default.refresh_secret,
        expiresIn: config_1.default.refresh_token_expires_in,
    });
    return {
        accessToken,
        refreshToken,
        isVerified: userExist.isVerified,
    };
});
const userLoginFromDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const userExist = yield user_model_1.User.isUserExistsByEmail(payload.email);
    if (!userExist) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Wrong email address");
    }
    if (userExist.role !== "customer") {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "You are not a customer");
    }
    if (userExist.isDeleted) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Sorry, your account was deleted");
    }
    const matchPassword = yield user_model_1.User.matchUserPassword(payload.password, userExist.password);
    if (!matchPassword) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Wrong password");
    }
    const jwtPayload = {
        email: userExist.email,
    };
    const accessToken = (0, auth_utils_1.createToken)({
        payload: jwtPayload,
        secret: config_1.default.access_secret,
        expiresIn: config_1.default.access_token_expires_in,
    });
    const refreshToken = (0, auth_utils_1.createToken)({
        payload: jwtPayload,
        secret: config_1.default.refresh_secret,
        expiresIn: config_1.default.refresh_token_expires_in,
    });
    return {
        accessToken,
        refreshToken,
        isVerified: userExist.isVerified,
    };
});
const refreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    if (!token) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized", "unauthorized access request");
    }
    const decoded = (0, verifyToken_1.default)(token, config_1.default.refresh_secret);
    if (!decoded) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized", "unauthorized access request");
    }
    const user = yield user_model_1.User.isUserExistsByEmail(decoded.email);
    if (user.isDeleted) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Your account was deleted", "unauthorized access request");
    }
    if (!user.isActive) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Your account is blocked", "unauthorized access request");
    }
    const payload = {
        userRole: user.role,
        email: user.email,
    };
    const accessToken = (0, auth_utils_1.createToken)({
        payload,
        secret: config_1.default.access_secret,
        expiresIn: config_1.default.access_token_expires_in,
    });
    return {
        accessToken,
    };
});
const forgotPasswordService = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.isUserExistsByEmail(email);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "User does not exist");
    }
    if (!user.isVerified) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are not verified. Please verify your email");
    }
    const otpCode = generateOTP();
    const otpToken = (0, auth_utils_1.createToken)({
        payload: {
            otpCode,
            email: user.email,
        },
        secret: config_1.default.otp_secret,
        expiresIn: config_1.default.otp_expires_in,
    });
    yield user_model_1.User.findByIdAndUpdate(user._id, { otp: otpToken });
    yield email_queue_1.emailQueue.add(email_queue_1.EmailJobName.sendResetPasswordEmail, {
        user,
        opt: otpCode,
    });
});
const resetPasswordService = (email, password, otp) => __awaiter(void 0, void 0, void 0, function* () {
    if (!otp) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Please enter opt code");
    }
    const user = yield user_model_1.User.isUserExistsByEmail(email);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "User does not exist");
    }
    if (!user.isVerified) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are not verified. Please verify your email first.");
    }
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(user.otp, config_1.default.otp_secret);
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.TokenExpiredError) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, "OTP has expired");
        }
        console.log(err);
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Failed to verify");
    }
    if (decoded.otpCode !== otp) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "OTP did not match");
    }
    if (email !== decoded.email) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Wrong email");
    }
    const hashPassword = yield bcrypt_1.default.hash(password, Number(config_1.default.bcrypt_hash_rounds));
    const updatePasswordRes = yield user_model_1.User.findOneAndUpdate({ email }, { password: hashPassword }).select("-password");
    return updatePasswordRes;
});
const SendVerificationEmailService = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.isUserExistsByEmail(email);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "User does not exist");
    }
    if (user.isVerified) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "User already verified. Please try signing in.");
    }
    const otpCode = generateOTP();
    const otpToken = (0, auth_utils_1.createToken)({
        payload: {
            otpCode,
            email: user.email,
        },
        secret: config_1.default.otp_secret,
        expiresIn: config_1.default.otp_expires_in,
    });
    yield user_model_1.User.findByIdAndUpdate(user._id, { otp: otpToken });
    yield email_queue_1.emailQueue.add(email_queue_1.EmailJobName.sendVerificationEmail, {
        user,
        opt: otpCode,
    });
});
const verifyEmailService = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    if (!otp) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Verification OTP is required", "unauthorized access request");
    }
    const user = yield user_model_1.User.isUserExistsByEmail(email);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "User does not exist");
    }
    if (user.isVerified) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are already verified. Please try signing in.");
    }
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(user.otp, config_1.default.otp_secret);
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.TokenExpiredError) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, "OTP has expired");
        }
        console.log(err);
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Failed to verify");
    }
    // const decoded = varifyToken(user.otp, config.otp_secret as string);
    if (decoded.otpCode !== otp) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "OTP did not match");
    }
    if (email !== decoded.email) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Wrong email");
    }
    const jwtPayload = {
        // userRole: userExist.role,
        email: user.email,
    };
    const accessToken = (0, auth_utils_1.createToken)({
        payload: jwtPayload,
        secret: config_1.default.access_secret,
        expiresIn: config_1.default.access_token_expires_in,
    });
    const refreshToken = (0, auth_utils_1.createToken)({
        payload: jwtPayload,
        secret: config_1.default.refresh_secret,
        expiresIn: config_1.default.refresh_token_expires_in,
    });
    const verifiedUser = yield user_model_1.User.findOneAndUpdate({ email }, { isVerified: true, otp: "" }).select("-password");
    return {
        accessToken,
        refreshToken,
        isVerified: user.isVerified,
        verifiedUser,
    };
});
const updatePasswordService = (newPassword, currentPassword, email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.isUserExistsByEmail(email);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "User does not exist");
    }
    const matchPassword = yield user_model_1.User.matchUserPassword(currentPassword, user.password);
    if (!matchPassword) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Password does not match");
    }
    const password = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_hash_rounds));
    const updated = yield user_model_1.User.updateOne({ email: user.email }, { password }).select("-password");
    return updated;
});
const getMyDataFromDB = (email, query) => __awaiter(void 0, void 0, void 0, function* () {
    let select = "";
    let populate = [];
    if (query.select) {
        select = query.select;
    }
    else {
        populate = [
            {
                path: "role",
            },
        ];
    }
    const result = yield user_model_1.User.findOne({ email })
        .populate(populate)
        .select(`${select} -password -otp`);
    return result;
});
const createCustomerIntoDB = (customer) => __awaiter(void 0, void 0, void 0, function* () {
    delete customer.isDeleted;
    const user = {
        email: customer.email,
        password: customer.password,
        userType: "customer",
        phoneNumber: customer.phoneNumber,
        name: customer.name,
    };
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const customerExist = yield user_model_1.User.isUserExistsByEmail(customer.email);
        if (customerExist) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, "You are already registered. Try singing in");
        }
        const otpCode = generateOTP();
        const otpToken = (0, auth_utils_1.createToken)({
            payload: {
                otpCode,
                email: user.email,
            },
            secret: config_1.default.otp_secret,
            expiresIn: config_1.default.otp_expires_in,
        });
        user.otp = otpToken;
        const userRes = yield user_model_1.User.create(user);
        if (!userRes) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, "failed to register account");
        }
        yield email_queue_1.emailQueue.add(email_queue_1.EmailJobName.sendVerificationEmail, {
            opt: otpCode,
            user,
        });
        yield session.commitTransaction();
        yield session.endSession();
        return {
            user: userRes,
            verficationSent: true,
        };
    }
    catch (err) {
        console.log(err);
        yield session.abortTransaction();
        yield session.endSession();
        throw new AppError_1.default(http_status_1.default.CONFLICT, err instanceof AppError_1.default ? err === null || err === void 0 ? void 0 : err.message : "Failed to create user");
    }
});
const updateMyProfileToDB = (data, user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, address, phoneNumber, profilePicture } = data;
        const result = yield user_model_1.User.findByIdAndUpdate(user, {
            name,
            address,
            profilePicture,
            phoneNumber,
        });
        return result;
    }
    catch (err) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, err instanceof AppError_1.default ? err === null || err === void 0 ? void 0 : err.message : "Failed to update profile");
    }
});
exports.AuthServices = {
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
