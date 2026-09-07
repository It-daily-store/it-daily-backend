import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { IAddress } from "./address.interface";
import Address from "./address.model";

const MAX_ADDRESSES_PER_USER = 15;

const getMyAddressesFromDB = async (user: string) => {
  const result = await Address.find({ user }).sort({
    isDefault: -1,
    createdAt: -1,
  });

  return result;
};

const clearOtherDefaults = async (user: string, keepId: string) => {
  await Address.updateMany(
    { user, _id: { $ne: keepId }, isDefault: true },
    { isDefault: false }
  );
};

const createAddressIntoDB = async (
  user: string,
  payload: Partial<IAddress>
) => {
  const existingCount = await Address.countDocuments({ user });

  if (existingCount >= MAX_ADDRESSES_PER_USER) {
    throw new AppError(
      httpStatus.CONFLICT,
      `You can only save up to ${MAX_ADDRESSES_PER_USER} addresses`
    );
  }

  // The first address a customer saves is always their default.
  const isDefault = existingCount === 0 ? true : !!payload.isDefault;

  const result = await Address.create({ ...payload, user, isDefault });

  if (isDefault) {
    await clearOtherDefaults(user, result._id.toString());
  }

  return result;
};

const updateAddressIntoDB = async (
  user: string,
  id: string,
  payload: Partial<IAddress>
) => {
  // A default is only ever cleared by promoting another address, so that a
  // customer with saved addresses always has one selected.
  const { isDefault, ...rest } = payload;
  const update = isDefault ? { ...rest, isDefault: true } : rest;

  const result = await Address.findOneAndUpdate({ _id: id, user }, update, {
    new: true,
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Address not found");
  }

  if (isDefault) {
    await clearOtherDefaults(user, id);
  }

  return result;
};

const setDefaultAddressIntoDB = async (user: string, id: string) => {
  const result = await Address.findOneAndUpdate(
    { _id: id, user },
    { isDefault: true },
    { new: true }
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Address not found");
  }

  await clearOtherDefaults(user, id);

  return result;
};

const deleteAddressFromDB = async (user: string, id: string) => {
  const result = await Address.findOneAndDelete({ _id: id, user });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Address not found");
  }

  // Never leave a customer without a default while they still have addresses.
  if (result.isDefault) {
    const next = await Address.findOne({ user }).sort({ createdAt: -1 });

    if (next) {
      await Address.findByIdAndUpdate(next._id, { isDefault: true });
    }
  }

  return result;
};

export const AddressService = {
  getMyAddressesFromDB,
  createAddressIntoDB,
  updateAddressIntoDB,
  setDefaultAddressIntoDB,
  deleteAddressFromDB,
};
