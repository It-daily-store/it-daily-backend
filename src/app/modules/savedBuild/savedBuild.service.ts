import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { ISavedBuild } from "./savedBuild.interface";
import SavedBuild from "./savedBuild.model";

const MAX_BUILDS_PER_USER = 20;

const PRODUCT_FIELDS =
  "name slug price discount thumbnail quantity shipping tax";

const getMyBuildsFromDB = async (user: string) => {
  const result = await SavedBuild.find({ user })
    .sort({ createdAt: -1 })
    .populate("parts.product", PRODUCT_FIELDS);

  return result;
};

const getSingleBuildFromDB = async (user: string, id: string) => {
  const result = await SavedBuild.findOne({ _id: id, user }).populate(
    "parts.product",
    PRODUCT_FIELDS
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Saved build not found");
  }

  return result;
};

const createBuildIntoDB = async (
  user: string,
  payload: Partial<ISavedBuild>
) => {
  const existingCount = await SavedBuild.countDocuments({ user });

  if (existingCount >= MAX_BUILDS_PER_USER) {
    throw new AppError(
      httpStatus.CONFLICT,
      `You can only save up to ${MAX_BUILDS_PER_USER} builds. Delete one to save another.`
    );
  }

  const created = await SavedBuild.create({ ...payload, user });

  return created.populate("parts.product", PRODUCT_FIELDS);
};

const updateBuildIntoDB = async (
  user: string,
  id: string,
  payload: Partial<ISavedBuild>
) => {
  const result = await SavedBuild.findOneAndUpdate({ _id: id, user }, payload, {
    new: true,
  }).populate("parts.product", PRODUCT_FIELDS);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Saved build not found");
  }

  return result;
};

const deleteBuildFromDB = async (user: string, id: string) => {
  const result = await SavedBuild.findOneAndDelete({ _id: id, user });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Saved build not found");
  }

  return result;
};

export const SavedBuildService = {
  getMyBuildsFromDB,
  getSingleBuildFromDB,
  createBuildIntoDB,
  updateBuildIntoDB,
  deleteBuildFromDB,
};
