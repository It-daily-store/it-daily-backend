import { TUser } from "../modules/user/user.interface";

export const makeFullName = (name: TUser["name"]): string => {
  const { firstName, middleName, lastName } = name;
  return [firstName, middleName, lastName].filter(Boolean).join(" ");
};
