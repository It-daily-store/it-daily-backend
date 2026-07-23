import Address from "./address.model";

const getMyAddressesFromDB = async (user: string) => {
  const result = await Address.find({ user });

  return result;
};

export const AddressService = {
  getMyAddressesFromDB,
};
