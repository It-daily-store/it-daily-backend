import jwt from "jsonwebtoken";
import { TName } from "../user/user.interface";
import config from "../../config";

type TCreateToken = {
  payload: { email: string; otpCode?: string };
  secret: string;
  expiresIn: string;
};

export const createToken = ({ payload, secret, expiresIn }: TCreateToken) => {
  return jwt.sign(payload, secret, { expiresIn });
};
