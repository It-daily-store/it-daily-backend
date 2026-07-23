import config from "../config";
import { TName } from "../modules/user/user.interface";

export const generateResetPassHtml = (otp: string, name: TName | undefined) => {
  return `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Reset Password</title>
                </head>
                <body style="font-family: Roboto, sans-serif; background-color: transparent; padding: 20px;">
                        <div
                        style="
                            text-align: center;
                            font-family: Roboto;
                            max-width: 500px;
                            margin: 0 auto;
                            background-color: rgb(243, 241, 255);
                            padding: 20px 40px;
                            border-radius: 8px;
                            box-shadow: 0px 0px 41px -9px rgba(0,0,0,0.73);
                            -webkit-box-shadow: 0px 0px 41px -9px rgba(0,0,0,0.73);
                            -moz-box-shadow: 0px 0px 41px -9px rgba(0,0,0,0.73);
                        "
                        >
                        <h2 style="text-align: center; color: #4a2cf2">Reset Your Password</h2>
                        <img
                            style="height: 100px; width: 100%; object-fit: contain"
                            src="https://res.cloudinary.com/dsgqdey2a/image/upload/v1728095680/online-security_5354534_ly328d.png"
                            alt=""
                        />
                        <p style="font-size: 16px; line-height: 24px">
                            Hello ${
                              name?.firstName +
                              " " +
                              (name?.middleName ? name?.middleName + " " : "") +
                              name?.lastName
                            },
                            <br />
                            We received a request to reset your password. Please use the following verification code to reset it. It will expire in ${
                              config.otp_expires_in?.split("")?.[0] || 5
                            } minutes:
                            <br />
                            <strong style="font-size: 24px;">${otp}</strong>
                        </p>
                        <p style="font-size: 16px; line-height: 24px">
                            If you did not request a password reset, please ignore this email or contact support if you have any concerns.
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
                    </body>
            </html>`;
};
