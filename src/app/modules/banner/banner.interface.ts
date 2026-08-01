import { Model } from "mongoose";

export type TOverlayBase = {
  id: string;
  xPercent: number; // 0-100, free-form position (element's CENTER), not a preset anchor
  yPercent: number; // 0-100
  widthPercent?: number;
  rotationDeg?: number;
  zIndex?: number;
};

export type TTextOverlay = TOverlayBase & {
  type: "text";
  text: string;
  fontSizePx?: number;
  color?: string;
  fontWeight?: "normal" | "bold";
  align?: "left" | "center" | "right";
};

export type TButtonOverlay = TOverlayBase & {
  type: "button";
  label: string;
  href: string;
  bgColor?: string;
  textColor?: string;
};

export type TOverlay = TTextOverlay | TButtonOverlay;

export type TImageLeafData = {
  kind: "image";
  src: string;
  alt?: string;
  link?: string;
  overlays: TOverlay[];
};

export type TCarouselSlide = {
  id: string;
  src: string;
  alt?: string;
  link?: string;
  overlays: TOverlay[]; // per-slide, independent — not shared across the carousel
};

export type TCarouselLeafData = {
  kind: "carousel";
  slides: TCarouselSlide[];
  autoplayMs?: number;
  loop?: boolean;
};

export type TLeafNode = { id: string; type: "leaf" } & (
  | TImageLeafData
  | TCarouselLeafData
);

export type TSplitNode = {
  id: string;
  type: "split";
  direction: "horizontal" | "vertical";
  sizes: number[];
  children: TPanelNode[];
};

export type TPanelNode = TSplitNode | TLeafNode;

export type TBreakpoints = {
  laptop: TPanelNode;
  tablet: TPanelNode;
  mobile: TPanelNode;
};

export type TBannerTemplate = {
  _id: string;
  name: string;
  slug: string;
  breakpoints: TBreakpoints;
  isDeleted: boolean;
  createdBy: string;
};

export interface TBannerTemplateModel extends Model<TBannerTemplate> {
  findActiveById(id: string): Promise<TBannerTemplate | null>;
}
