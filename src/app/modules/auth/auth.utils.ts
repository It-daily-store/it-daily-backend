import jwt, { SignOptions } from "jsonwebtoken";

type TCreateToken = {
  payload: { email: string; otpCode?: string };
  secret: string;
  expiresIn: string;
};

export const createToken = ({ payload, secret, expiresIn }: TCreateToken) => {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  });
};
