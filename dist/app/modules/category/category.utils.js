"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCategoryTree = void 0;
const generateCategoryTree = (categories, parent_id = null) => {
    let categoryTree = [];
    let filterCategories;
    if (parent_id === null) {
        filterCategories = categories.filter((cat) => cat.parent_id === null);
    }
    else {
        filterCategories = categories.filter((cat) => cat.parent_id === parent_id);
    }
    if (filterCategories.length !== 0) {
        for (const category of filterCategories) {
            categoryTree.push({
                _id: category._id,
                name: category.name,
                parent_id: category.parent_id,
                product_details_categories: category.product_details_categories,
                subCategories: (0, exports.generateCategoryTree)(categories, category.id),
                isDeleted: false,
                slug: category.slug,
                image: category.image,
                isFeatured: category.isFeatured,
            });
        }
    }
    return categoryTree;
};
exports.generateCategoryTree = generateCategoryTree;
