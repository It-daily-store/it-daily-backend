import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { BannerTemplate } from "./banner.model";
import { TBreakpoints, TBannerTemplate } from "./banner.interface";
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
  payload: { name: string; breakpoints: TBreakpoints },
  admin: TUser
) => {
  const slug = await generateUniqueSlug(payload.name);
  return BannerTemplate.create({ ...payload, slug, createdBy: admin._id });
};

const getAllTemplatesFromDB = async () =>
  BannerTemplate.find({ isDeleted: false })
    .select("name slug createdAt updatedAt")
    .sort({ updatedAt: -1 });

const getTemplateByIdFromDB = async (id: string) => {
  const result = await BannerTemplate.findOne({ _id: id, isDeleted: false });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Banner template not found");
  }
  return result;
};

const updateTemplateIntoDB = async (
  id: string,
  payload: Partial<Pick<TBannerTemplate, "name" | "breakpoints">>
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
    slug,
    breakpoints: source.breakpoints,
    createdBy: admin._id,
  });
};

const deleteTemplateFromDB = async (id: string) => {
  const exists = await BannerTemplate.findOne({ _id: id, isDeleted: false });
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, "Banner template not found");
  }
  return BannerTemplate.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
};

export const BannerTemplateServices = {
  createTemplateIntoDB,
  getAllTemplatesFromDB,
  getTemplateByIdFromDB,
  updateTemplateIntoDB,
  renameTemplateIntoDB,
  duplicateTemplateIntoDB,
  deleteTemplateFromDB,
};
