import { model, Schema } from "mongoose";
import { TBannerTemplate, TBannerTemplateModel } from "./banner.interface";

const bannerTemplateSchema = new Schema<TBannerTemplate>(
  {
    name: { type: String, required: [true, "Template name is required"] },
    slug: { type: String, required: true },
    description: { type: String, default: "" },
    breakpoints: {
      laptop: { type: Schema.Types.Mixed, required: true },
      tablet: { type: Schema.Types.Mixed, required: true },
      mobile: { type: Schema.Types.Mixed, required: true },
    },
    is_active: { type: Boolean, default: false },
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

// At most one template may be active at a time — the storefront renders a
// single hero banner. Enforced with an index rather than in the service
// alone so two concurrent activations can't both succeed and leave the
// storefront with an ambiguous choice. Scoped to non-deleted rows for the
// same reason the slug index is: a soft-deleted template must not go on
// holding the active slot.
bannerTemplateSchema.index(
  { is_active: 1 },
  {
    unique: true,
    partialFilterExpression: { is_active: true, isDeleted: false },
  }
);

bannerTemplateSchema.statics.findActiveById = async function (id: string) {
  return this.findOne({ _id: id, isDeleted: false });
};

export const BannerTemplate = model<TBannerTemplate, TBannerTemplateModel>(
  "BannerTemplate",
  bannerTemplateSchema
);
