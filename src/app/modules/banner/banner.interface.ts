import { Model } from "mongoose";

export type TBannerTemplateId = "carousel" | "splitGrid" | "sideBanner";

export type TImageSlot = {
  mobile: string;
  tablet: string;
  laptop: string;
};

export type TCarouselSlide = {
  images: TImageSlot;
  headline?: string;
  subtext?: string;
  ctaLabel?: string;
  ctaLink?: string;
};

export type TCarouselData = {
  slides: TCarouselSlide[];
};

export type TSplitGridTextTile = {
  images: TImageSlot;
  headline?: string;
  subtext?: string;
  ctaLabel?: string;
  ctaLink?: string;
};

export type TSplitGridLinkTile = {
  images: TImageSlot;
  link?: string;
};

export type TSplitGridData = {
  main: TSplitGridTextTile;
  top: TSplitGridLinkTile;
  bottom: TSplitGridLinkTile;
};

export type TSideBannerData = {
  images: TImageSlot;
  headline?: string;
  subtext?: string;
  ctaLabel?: string;
  ctaLink?: string;
};

export type TBannerData = TCarouselData | TSplitGridData | TSideBannerData;

export type TBanner = {
  _id: string;
  templateId: TBannerTemplateId;
  active: boolean;
  data: TBannerData;
};

export interface TBannerModel extends Model<TBanner> {
  findByTemplateId(templateId: TBannerTemplateId): Promise<TBanner | null>;
}
