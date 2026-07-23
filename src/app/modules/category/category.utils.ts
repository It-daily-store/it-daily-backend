import { FilterQuery, Query, Types } from "mongoose";
import { Category } from "./category.model";
import { TCategory } from "./category.interface";

export const generateCategoryTree = (
  categories: FilterQuery<TCategory[]>,
  parent_id = null
) => {
  let categoryTree: TCategory[] = [];

  let filterCategories;

  if (parent_id === null) {
    filterCategories = categories.filter((cat) => cat.parent_id === null);
  } else {
    filterCategories = categories.filter((cat) => cat.parent_id === parent_id);
  }

  if (filterCategories.length !== 0) {
    for (const category of filterCategories) {
      categoryTree.push({
        _id: category._id,
        name: category.name,
        parent_id: category.parent_id,
        product_details_categories: category.product_details_categories,
        subCategories: generateCategoryTree(categories, category.id),
        isDeleted: false,
        slug: category.slug,
        image: category.image,
        isFeatured: category.isFeatured,
      });
    }
  }

  return categoryTree;
};
