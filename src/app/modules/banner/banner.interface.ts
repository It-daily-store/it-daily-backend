import { Model } from "mongoose";

export type TBreakpointName = "laptop" | "tablet" | "mobile";

/**
 * The internal shape of a breakpoint's layout tree (panels, splits,
 * elements) is owned entirely by the react-bannerkit package, not this
 * backend. Typing it field-by-field here would couple this module to the
 * package's exact current version and break on every future field the
 * package adds or renames — react-bannerkit already handles shape drift
 * itself via its own client-side normalizeTemplate() repair pass. This
 * backend only enforces what it actually needs to: a bounded nesting
 * depth and no unsafe URL scheme anywhere in the tree (see
 * banner.validation.ts / banner.utils.ts) — everything else passes
 * through opaquely.
 */
export type TBannerBreakpoint = Record<string, unknown>;

export type TBannerTemplate = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  breakpoints: Record<TBreakpointName, TBannerBreakpoint>;
  /**
   * Marks the single template the storefront renders. Exclusive:
   * activating a template deactivates whichever one held the slot before
   * it, so this is true for at most one non-deleted document at a time.
   */
  is_active: boolean;
  isDeleted: boolean;
  createdBy: string;
};

export interface TBannerTemplateModel extends Model<TBannerTemplate> {
  findActiveById(id: string): Promise<TBannerTemplate | null>;
}
