import { JwtPayload } from "jsonwebtoken";
import { TUser } from "../modules/user/user.interface";
import { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: Types.ObjectId;
        userRole: string;
        email: string;
        userData: TUser;
      };
    }
  }
}

declare module "socket.io" {
  interface Socket {
    user?: {
      userData?: TUser;
      userRole: string;
      email: string;
    };
  }
}
