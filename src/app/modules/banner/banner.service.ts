import { Banner } from "./banner.model";
import { BANNER_TEMPLATE_IDS, DEFAULT_BANNER_DATA } from "./banner.constant";
import { TBannerData, TBannerTemplateId } from "./banner.interface";

const ensureBannersSeeded = async () => {
  const existing = await Banner.find();
  const existingIds = new Set(existing.map((b) => b.templateId));
  const missingIds = BANNER_TEMPLATE_IDS.filter((id) => !existingIds.has(id));

  if (missingIds.length > 0) {
    const noneActiveYet = existing.every((b) => !b.active);
    const toInsert = missingIds.map((templateId) => ({
      templateId,
      active: noneActiveYet && templateId === "carousel",
      data: DEFAULT_BANNER_DATA[templateId],
    }));
    await Banner.insertMany(toInsert);
  }
};

const getAllBannersFromDB = async () => {
  await ensureBannersSeeded();
  return Banner.find();
};

const getActiveBannerFromDB = async () => {
  await ensureBannersSeeded();
  return Banner.findOne({ active: true });
};

const updateBannerFromDB = async (
  templateId: TBannerTemplateId,
  data: TBannerData
) => {
  return Banner.findOneAndUpdate(
    { templateId },
    { data },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
};

const setActiveBannerFromDB = async (templateId: TBannerTemplateId) => {
  await Banner.updateMany({ templateId: { $ne: templateId } }, { active: false });

  return Banner.findOneAndUpdate(
    { templateId },
    { active: true },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
};

export const BannerServices = {
  getAllBannersFromDB,
  getActiveBannerFromDB,
  updateBannerFromDB,
  setActiveBannerFromDB,
};
