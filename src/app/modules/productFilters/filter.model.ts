import { model, Schema } from "mongoose";
import { TFilterModel, TProductFilter } from "./filter.interface";

const FilterSchema = new Schema<TProductFilter, TFilterModel>(
  {
    filterId: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      max: 999,
    },
    title: {
      type: String,
      required: [true, "Filter Title is required"],
      unique: true,
    },
    options: [
      {
        optionId: {
          type: Schema.Types.Mixed,
          validate: {
            validator: (v: any) =>
              typeof v === "string" || typeof v === "number",
            message: (props) => `${props.value} must be a string or a number`,
          },
          required: true,
          min: 1,
        },
        value: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

FilterSchema.statics.findFilterById = async function (id: string) {
  const result = await ProductFilter.findById(id);

  return result;
};

FilterSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Assign filterId by finding the highest existing ID and adding 1
    const maxFilterId = 999999;
    const lastFilter = await ProductFilter.findOne()
      .sort({ filterId: -1 }) // Sort descending to get highest filterId
      .select("filterId");

    let filterId = lastFilter ? lastFilter.filterId + 1 : 1;

    if (filterId > maxFilterId) {
      throw new Error(
        `Unable to assign a unique filter ID; maximum ID (${maxFilterId}) reached`
      );
    }

    this.filterId = filterId;

    // Assign sequential option IDs
    const existingOptionIds = new Set<number>();
    for (const option of this.options) {
      let optionId = 1;
      const maxOptionId = 1000;

      while (optionId <= maxOptionId) {
        if (!existingOptionIds.has(optionId)) {
          option.optionId = String(optionId);
          existingOptionIds.add(optionId);
          break;
        }
        optionId++;
      }

      if (!option.optionId) {
        throw new Error(
          "Unable to assign unique option IDs for filter; all IDs from 1 to 1000 are taken"
        );
      }
    }
  }
  next();
});

const ProductFilter = model<TProductFilter, TFilterModel>(
  "ProductFilter",
  FilterSchema
);

export default ProductFilter;
