import { Banner } from "./banner.model";
import { BANNER_TEMPLATE_IDS, DEFAULT_BANNER_DATA } from "./banner.constant";
import { TBannerData, TBannerTemplateId } from "./banner.interface";

const TEMPLATE_FILTER = { templateId: { $in: BANNER_TEMPLATE_IDS } };

const ensureBannersSeeded = async () => {
  // Remove any legacy/stale documents that don't belong to one of the known
  // permanent templates (e.g. the old single-document `gridSlider` schema).
  await Banner.deleteMany({ templateId: { $nin: BANNER_TEMPLATE_IDS } });

  const existing = await Banner.find(TEMPLATE_FILTER);
  const existingIds = new Set(existing.map((b) => b.templateId));
  const missingIds = BANNER_TEMPLATE_IDS.filter((id) => !existingIds.has(id));

  if (missingIds.length > 0) {
    const noneActiveYet = existing.every((b) => !b.active);

    try {
      await Promise.all(
        missingIds.map((templateId) =>
          Banner.updateOne(
            { templateId },
            {
              $setOnInsert: {
                active: noneActiveYet && templateId === "carousel",
                data: DEFAULT_BANNER_DATA[templateId],
              },
            },
            { upsert: true }
          )
        )
      );
    } catch (err) {
      // Concurrent requests on a cold DB can race to upsert the same
      // template; the loser simply finds the doc already there. Only
      // swallow the duplicate-key case, rethrow anything else.
      const isDuplicateKeyError =
        typeof err === "object" &&
        err !== null &&
        (err as { code?: number }).code === 11000;
      if (!isDuplicateKeyError) {
        throw err;
      }
    }
  }

  // Enforce the "exactly one active at all times" invariant regardless of
  // whether anything was just inserted above (e.g. all 3 templates already
  // existed but none was active).
  const activeCount = await Banner.countDocuments({
    ...TEMPLATE_FILTER,
    active: true,
  });
  if (activeCount === 0) {
    await Banner.updateOne({ templateId: "carousel" }, { active: true });
  }
};

const getAllBannersFromDB = async () => {
  await ensureBannersSeeded();
  return Banner.find(TEMPLATE_FILTER);
};

const getActiveBannerFromDB = async () => {
  await ensureBannersSeeded();
  return Banner.findOne({ ...TEMPLATE_FILTER, active: true });
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
