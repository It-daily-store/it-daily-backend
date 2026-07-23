"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProductQuery = exports.parseFilters = exports.extractCommonFilters = exports.createCategoryArray = exports.transformSvgProductData = exports.claculateSpecialPrice = void 0;
const typeMap = {
    price: "number",
    special_price: "number",
    "discount.value": "number",
    quantity: "number",
    "warranty.days": "number",
    "warranty.lifetime": "boolean",
    "shipping.free": "boolean",
    "shipping.cost": "number",
    isFeatured: "boolean",
};
const claculateSpecialPrice = (discount, price) => {
    if (discount.type === "flat") {
        const newDiscount = price - discount.value;
        return Math.max(0, Math.round(newDiscount)); // Ensure no negative price
    }
    else {
        const newDiscount = price - Math.floor((price * discount.value) / 100);
        return Math.max(0, Math.round(newDiscount)); // Ensure no negative price
    }
};
exports.claculateSpecialPrice = claculateSpecialPrice;
const transformSvgProductData = (data) => {
    const result = Object.assign({}, data);
    Object.keys(typeMap).forEach((key) => {
        const keys = key.split("."); // Handle nested keys
        let current = result;
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (i === keys.length - 1) {
                // Leaf node
                const expectedType = typeMap[key];
                const value = current[k];
                if (expectedType === "number") {
                    current[k] = isNaN(Number(value)) ? 0 : Number(value);
                }
                else if (expectedType === "boolean") {
                    current[k] = value === true || value === "true"; // Convert to boolean
                }
            }
            else {
                // Ensure nested objects exist
                if (!current[k]) {
                    current[k] = {};
                }
                current = current[k];
            }
        }
    });
    return result;
};
exports.transformSvgProductData = transformSvgProductData;
const createCategoryArray = (categoryArray, selected, data = []) => {
    if (!selected) {
        return;
    }
    if (selected.parent_id) {
        data.push({
            main: data.length === 0,
            id: selected._id,
        });
        const parent = categoryArray === null || categoryArray === void 0 ? void 0 : categoryArray.find((cat) => cat._id === selected.parent_id);
        (0, exports.createCategoryArray)(categoryArray, parent, data);
    }
    else {
        data.push({
            main: data.length === 0,
            id: selected._id,
        });
    }
    return data;
};
exports.createCategoryArray = createCategoryArray;
const extractCommonFilters = (products) => {
    if (!products.length)
        return [];
    // Create a map to count filter occurrences
    const filterMap = new Map();
    // Process each product's filters
    products.forEach((product) => {
        if (product.filters && Array.isArray(product.filters)) {
            product.filters.forEach((filter) => {
                const filterKey = `${filter.filter}_${filter.fitlerId}`;
                if (filterMap.has(filterKey)) {
                    const existing = filterMap.get(filterKey);
                    existing.values.add(filter.value);
                    existing.count += 1;
                }
                else {
                    filterMap.set(filterKey, {
                        filter: filter.filter,
                        filterId: filter.fitlerId,
                        values: new Set([filter.value]),
                        count: 1,
                    });
                }
            });
        }
    });
    // Convert to array and filter for common filters
    // You can adjust the threshold (e.g., appears in at least 20% of products)
    const threshold = Math.max(1, Math.floor(products.length * 0.1)); // At least 10% of products
    return Array.from(filterMap.values())
        .filter((filter) => filter.count >= threshold)
        .map((filter) => ({
        filter: filter.filter,
        fitlerId: filter.filterId,
        values: Array.from(filter.values).sort(),
        productCount: filter.count,
    }))
        .sort((a, b) => b.productCount - a.productCount); // Sort by popularity
};
exports.extractCommonFilters = extractCommonFilters;
const parseFilters = (filterArray) => {
    if (!filterArray) {
        return {};
    }
    // Ensure we have an array
    const filters = Array.isArray(filterArray) ? filterArray : [filterArray];
    const parsedFilters = {};
    filters.forEach((filterString) => {
        // Split by ':' to separate filterId and optionIds
        const [filterId, optionIdsString] = filterString.split(":");
        if (filterId && optionIdsString) {
            // Parse option IDs from comma-separated string
            const optionIds = optionIdsString
                .split(",")
                .map((id) => parseInt(id.trim(), 10))
                .filter((id) => !isNaN(id));
            if (optionIds.length > 0) {
                parsedFilters[filterId] = optionIds;
            }
        }
    });
    return parsedFilters;
};
exports.parseFilters = parseFilters;
const buildProductQuery = (categoryId, parsedFilters) => {
    const baseQuery = {
        "category.id": categoryId,
    };
    // Add filter conditions if filters exist
    if (Object.keys(parsedFilters).length > 0) {
        const filterConditions = [];
        Object.entries(parsedFilters).forEach(([filterId, optionIds]) => {
            // Convert optionIds to strings since they're stored as strings in the database
            const optionIdsAsStrings = optionIds.map((id) => id.toString());
            filterConditions.push({
                filters: {
                    $elemMatch: {
                        filterId: Number(filterId),
                        value: { $in: optionIdsAsStrings },
                    },
                },
            });
        });
        // Use $and to ensure all filter conditions are met
        if (filterConditions.length > 0) {
            baseQuery.$and = filterConditions;
        }
    }
    return baseQuery;
};
exports.buildProductQuery = buildProductQuery;
