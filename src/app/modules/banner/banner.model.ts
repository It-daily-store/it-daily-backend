import { model, Schema } from "mongoose";
import { TBannerTemplate, TBannerTemplateModel } from "./banner.interface";

const bannerTemplateSchema = new Schema<TBannerTemplate>(
  {
    name: { type: String, required: [true, "Template name is required"] },
    slug: { type: String, required: true },
    breakpoints: {
      laptop: { type: Schema.Types.Mixed, required: true },
      tablet: { type: Schema.Types.Mixed, required: true },
      mobile: { type: Schema.Types.Mixed, required: true },
    },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: String, required: true, ref: "User" },
  },
  { timestamps: true }
);

// A slug only has to be unique among non-deleted templates, so a name can
// be reused after its original template is (soft-)deleted.
bannerTemplateSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

bannerTemplateSchema.statics.findActiveById = async function (id: string) {
  return this.findOne({ _id: id, isDeleted: false });
};

// Deliberately a NEW collection name ("bannertemplates", Mongoose's
// default pluralization of "BannerTemplate") rather than reusing the old
// "banners" collection, which still holds one legacy gridSlider document
// on main — this avoids any chance of that stale doc surfacing in a
// find({}) against the new model. The old "banners" collection is orphaned
// and can be dropped manually in Mongo whenever convenient; it is not
// read by any code after this change.
export const BannerTemplate = model<TBannerTemplate, TBannerTemplateModel>(
  "BannerTemplate",
  bannerTemplateSchema
);
