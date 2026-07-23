import Banner from "./banner.model";

const getBannerFromDB = async (id: string) => {
  const result = await Banner.findOne({ id });

  return result;
};

export const BannerServices = { getBannerFromDB };
