"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVerifyEmailHtml = void 0;
const config_1 = __importDefault(require("../config"));
const generateVerifyEmailHtml = (otpCode, name) => {
    var _a, _b;
    return `
        <div
        style="
            text-align: center;
            font-family: Roboto;
            max-width: 500px;
            margin: 0 auto;
            background-color: rgb(243, 241, 255);
            padding: 20px 40px;
            border-radius: 8px;
            box-shadow: 0px 0px 41px -9px rgba(0, 0, 0, 0.73);
            -webkit-box-shadow: 0px 0px 41px -9px rgba(0, 0, 0, 0.73);
            -moz-box-shadow: 0px 0px 41px -9px rgba(0, 0, 0, 0.73);
        "
        >
        <h2 style="text-align: center; color: #4a2cf2">Verify your email</h2>
        <img
            style="height: 100px; width: 100%; object-fit: contain"
            src="https://res.cloudinary.com/dsgqdey2a/image/upload/v1728097863/email_verify_guog7a.png"
            alt=""
        />
        <p style="font-size: 16px; line-height: 24px">
            Hello ${(name === null || name === void 0 ? void 0 : name.firstName) + " " + (name === null || name === void 0 ? void 0 : name.middleName) + " " + (name === null || name === void 0 ? void 0 : name.lastName)},
            <br />
            To verify your email, please use the following verification code. It will expire in ${((_b = (_a = config_1.default.otp_expires_in) === null || _a === void 0 ? void 0 : _a.split("")) === null || _b === void 0 ? void 0 : _b[0]) || 5} minutes
            <br />
             <strong style="font-size: 24px;">${otpCode}</strong>
        </p>
        <p style="font-size: 16px; line-height: 24px">
            If you did not request to verify your email, please ignore this email or contact support if you have any concerns.
        </p>
        <p style="font-size: 16px; line-height: 24px">
            Thanks,
            <br />
            The GadgetGrid Team
        </p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0" />
        <p style="font-size: 12px; text-align: center">
            If you have trouble using the verification code, please contact our support team.
        </p>
        </div>
    `;
};
exports.generateVerifyEmailHtml = generateVerifyEmailHtml;
