import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { BannerTemplate } from "./banner.model";
import { TBannerBreakpoint, TBannerTemplate, TBreakpointName } from "./banner.interface";
import { TUser } from "../user/user.interface";

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const generateUniqueSlug = async (name: string): Promise<string> => {
  const base = slugify(name) || "template";
  let candidate = base;
  let suffix = 1;
  while (await BannerTemplate.exists({ slug: candidate, isDeleted: false })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
};

const createTemplateIntoDB = async (
  payload: {
    name: string;
    description?: string;
    breakpoints: Record<TBreakpointName, TBannerBreakpoint>;
  },
  admin: TUser
) => {
  const slug = await generateUniqueSlug(payload.name);
  return BannerTemplate.create({ ...payload, slug, createdBy: admin._id });
};

const getAllTemplatesFromDB = async () =>
  BannerTemplate.find({ isDeleted: false })
    .select("name slug is_active createdAt updatedAt")
    .sort({ updatedAt: -1 });

const getTemplateByIdFromDB = async (id: string) => {
  // This route is public (no auth) — exclude fields that don't need to
  // reach an unauthenticated visitor: the creating admin's user id and the
  // internal soft-delete flag (always false here anyway, since it's part
  // of the query above).
  const result = await BannerTemplate.findOne({
    _id: id,
    isDeleted: false,
  }).select("-createdBy -isDeleted -__v");
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Banner template not found");
  }
  return result;
};

// Same public projection as getTemplateByIdFromDB — this is the storefront's
// entry point. Deliberately resolves to null instead of throwing 404 when
// nothing is active: "no banner is configured right now" is a normal state
// an admin can create by toggling the last active template off, and the
// storefront should render no banner rather than treat it as an error.
const getActiveTemplateFromDB = async () =>
  BannerTemplate.findOne({ is_active: true, isDeleted: false }).select(
    "-createdBy -isDeleted -__v"
  );

const setActiveTemplateInDB = async (id: string, isActive: boolean) => {
  const exists = await BannerTemplate.findOne({ _id: id, isDeleted: false });
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, "Banner template not found");
  }

  if (!isActive) {
    return BannerTemplate.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true }
    );
  }

  // Release the slot before claiming it. The partial unique index in
  // banner.model.ts permits a single active row, so activating first and
  // clearing after would collide with the outgoing template.
  await BannerTemplate.updateMany(
    { _id: { $ne: id }, is_active: true },
    { is_active: false }
  );

  return BannerTemplate.findByIdAndUpdate(id, { is_active: true }, { new: true });
};

const updateTemplateIntoDB = async (
  id: string,
  payload: Partial<Pick<TBannerTemplate, "name" | "description" | "breakpoints">>
) => {
  const exists = await BannerTemplate.findOne({ _id: id, isDeleted: false });
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, "Banner template not found");
  }
  return BannerTemplate.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

const renameTemplateIntoDB = async (id: string, name: string) => {
  const exists = await BannerTemplate.findOne({ _id: id, isDeleted: false });
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, "Banner template not found");
  }
  return BannerTemplate.findByIdAndUpdate(id, { name }, { new: true });
};

const duplicateTemplateIntoDB = async (id: string, admin: TUser) => {
  const source = await BannerTemplate.findOne({ _id: id, isDeleted: false });
  if (!source) {
    throw new AppError(httpStatus.NOT_FOUND, "Banner template not found");
  }
  const name = `${source.name} (copy)`;
  const slug = await generateUniqueSlug(name);
  return BannerTemplate.create({
    name,
    description: source.description,
    slug,
    breakpoints: source.breakpoints,
    // Explicit rather than relying on the schema default: duplicating the
    // live template must not produce a second active row.
    is_active: false,
    createdBy: admin._id,
  });
};

const deleteTemplateFromDB = async (id: string) => {
  const exists = await BannerTemplate.findOne({ _id: id, isDeleted: false });
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, "Banner template not found");
  }
  // Clearing is_active alongside the soft delete leaves the storefront with
  // no banner rather than a deleted one, and frees the active slot for the
  // next template an admin picks.
  return BannerTemplate.findByIdAndUpdate(
    id,
    { isDeleted: true, is_active: false },
    { new: true }
  );
};

export const BannerTemplateServices = {
  createTemplateIntoDB,
  getAllTemplatesFromDB,
  getTemplateByIdFromDB,
  getActiveTemplateFromDB,
  setActiveTemplateInDB,
  updateTemplateIntoDB,
  renameTemplateIntoDB,
  duplicateTemplateIntoDB,
  deleteTemplateFromDB,
};
