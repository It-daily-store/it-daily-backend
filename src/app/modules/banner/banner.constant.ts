import { TBannerTemplateId, TBannerData } from "./banner.interface";

export const BANNER_TEMPLATE_IDS: TBannerTemplateId[] = [
  "carousel",
  "splitGrid",
  "sideBanner",
];

const emptyImageSlot = { mobile: "", tablet: "", laptop: "" };

export const DEFAULT_BANNER_DATA: Record<TBannerTemplateId, TBannerData> = {
  carousel: {
    slides: [{ images: { ...emptyImageSlot } }],
  },
  splitGrid: {
    main: { images: { ...emptyImageSlot } },
    top: { images: { ...emptyImageSlot } },
    bottom: { images: { ...emptyImageSlot } },
  },
  sideBanner: {
    images: { ...emptyImageSlot },
  },
};
