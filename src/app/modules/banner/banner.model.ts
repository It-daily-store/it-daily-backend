import { model, Schema } from "mongoose";
import { TBanner, TBannerModel, TBannerTemplateId } from "./banner.interface";
import { BANNER_TEMPLATE_IDS } from "./banner.constant";

const bannerSchema = new Schema<TBanner>({
  templateId: {
    type: String,
    enum: BANNER_TEMPLATE_IDS,
    required: true,
    unique: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Schema.Types.Mixed,
    default: {},
  },
});

bannerSchema.statics.findByTemplateId = async function (
  templateId: TBannerTemplateId
) {
  return this.findOne({ templateId });
};

export const Banner = model<TBanner, TBannerModel>("banners", bannerSchema);
