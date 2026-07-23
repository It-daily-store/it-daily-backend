import httpStatus from "http-status";
import { TProductFilter } from "./filter.interface";
import ProductFilter from "./filter.model";
import AppError from "../../errors/AppError";

const createFilterIntoDB = async (
  payload: Partial<TProductFilter & { options: string[] }>
) => {
  // Transform options to include value property
  const formattedPayload = {
    ...payload,
    filterId: 1,
    options: payload.options?.map((option: string) => ({
      value: option,
      optionId: 1,
    })),
  };

  const result = await ProductFilter.create(formattedPayload);
  return result;
};

const getAllFiltersFromDB = async () => {
  const result = await ProductFilter.find();
  return result;
};

const deleteFilterFromDB = async (id: string) => {
  const exist = await ProductFilter.findFilterById(id);

  if (!exist) {
    throw new AppError(httpStatus.FORBIDDEN, "Product filter does not exists");
  }

  const result = await ProductFilter.findByIdAndDelete(id);

  return result;
};

const updateFilterIntoDB = async (
  id: string,
  payload: Partial<
    TProductFilter & { options: { optionId?: number; value: string }[] }
  >
) => {
  // Find the existing filter
  const existingFilter = await ProductFilter.findById(id);
  if (!existingFilter) {
    throw new Error(`Filter with filterId not found`);
  }

  // Prepare the update payload
  const updatePayload: Partial<TProductFilter> = {};

  // Update title if provided
  if (payload.title !== undefined) {
    updatePayload.title = payload.title;
  }

  // Process options if provided
  if (payload.options !== undefined) {
    const existingOptionIds = new Set(
      existingFilter.options.map((opt) => opt.optionId)
    );
    let nextOptionId = existingFilter.options.length
      ? Math.max(...existingFilter.options.map((opt) => Number(opt.optionId))) +
        1
      : 1;
    const maxOptionId = 1000;

    updatePayload.options = payload.options.map((newOption) => {
      // Existing option (has optionId): update value, preserve optionId
      if (
        newOption.optionId !== undefined ||
        newOption.optionId !== "undefined"
      ) {
        const existingOption = existingFilter.options.find(
          (opt) => String(opt.optionId) === String(newOption.optionId)
        );
        if (!existingOption) {
          throw new Error(
            `Option with optionId ${newOption.optionId} not found in filter`
          );
        }
        return {
          optionId: String(newOption.optionId),
          value: newOption.value,
        };
      }
      // New option (no optionId): assign next available optionId
      while (existingOptionIds.has(String(nextOptionId))) {
        nextOptionId++;
      }
      if (nextOptionId > maxOptionId) {
        throw new Error(
          `Unable to assign unique option ID for filter maximum ID (${maxOptionId}) reached`
        );
      }
      existingOptionIds.add(String(nextOptionId));
      return {
        optionId: String(nextOptionId++),
        value: newOption.value,
      };
    });
  }

  // Update only the provided fields
  const result = await ProductFilter.findOneAndUpdate(
    { filterId: existingFilter.filterId },
    { $set: updatePayload },
    { new: true, runValidators: true }
  );

  return result;
};

export const FilterServices = {
  createFilterIntoDB,
  updateFilterIntoDB,
  getAllFiltersFromDB,
  deleteFilterFromDB,
};
