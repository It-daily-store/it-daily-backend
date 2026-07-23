"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const user_model_1 = require("../user/user.model");
const product_interface_1 = require("./product.interface");
const product_model_1 = require("./product.model");
const slugify_1 = __importDefault(require("slugify"));
const papaparse_1 = __importDefault(require("papaparse"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const category_model_1 = require("../category/category.model");
const product_utils_1 = require("./product.utils");
const brand_model_1 = require("../brand/brand.model");
const handleDuplicateError_1 = __importDefault(require("../../errors/handleDuplicateError"));
const mongodb_1 = require("mongodb");
const mongoose_1 = __importStar(require("mongoose"));
const bulkUpload_model_1 = __importDefault(require("../bulkUpload/bulkUpload.model"));
const queryBuilder_1 = __importDefault(require("../../builder/queryBuilder"));
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
dayjs_1.default.extend(utc_1.default);
const notificaiton_utils_1 = require("../notification/notificaiton.utils");
const filter_model_1 = __importDefault(require("../productFilters/filter.model"));
const product_redis_1 = require("./product.redis");
const sift_1 = __importDefault(require("sift"));
const product_queue_1 = require("./product.queue");
const settings_model_1 = __importDefault(require("../settings/settings.model"));
const createProductIntoDB = (payload, email, thisUser) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const user = yield user_model_1.User.isUserExistsByEmail(email);
    if (!user._id) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Could not find admin information");
    }
    const slug = (0, slugify_1.default)(payload.name);
    const productData = payload;
    productData.createdBy = user._id;
    productData.slug = slug;
    productData.mainCategory = (_b = (_a = productData.category) === null || _a === void 0 ? void 0 : _a.find((c) => c.main === true)) === null || _b === void 0 ? void 0 : _b.id;
    if (payload.discount && ((_c = payload.discount) === null || _c === void 0 ? void 0 : _c.value) > 0) {
        productData.special_price = (0, product_utils_1.claculateSpecialPrice)(payload.discount, payload.price);
    }
    const result = yield product_model_1.Product.create(productData);
    if (result) {
        if (!thisUser || !thisUser._id) {
            return;
        }
        const notifications = yield (0, notificaiton_utils_1.buildNotifications)({
            source: result._id,
            text: "added a product",
            thisUser,
            notificationType: "product",
            actionType: "create",
        });
        yield (0, notificaiton_utils_1.addNotifications)({ notifications, userFrom: thisUser });
    }
    return result;
});
const getAllProductsFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const searchFields = [
        "name",
        "model",
        "key_features",
        "description",
        "slug",
        "sku",
    ];
    const excludeFields = [
        "searchTerm",
        "page",
        "limit",
        "category",
        "sort",
        "fields",
    ];
    const pagination = {
        total: 0,
        currentPage: query.page ? Number(query.page) : 1,
        limit: query.limit ? Number(query.limit) : 10,
    };
    const limit = pagination.limit;
    const skip = (pagination.currentPage - 1) * limit;
    let result;
    const redisProducts = yield (0, product_redis_1.getProductsFromRedis)();
    if (!redisProducts || (redisProducts === null || redisProducts === void 0 ? void 0 : redisProducts.length) === 0) {
        if (query.category) {
            query.mainCategory = new mongodb_1.ObjectId(query.category);
            delete query.categroy;
        }
        if (query.createdBy) {
            query.createdBy = new mongodb_1.ObjectId(query.createdBy);
        }
        if (query.createdAt) {
            const startOfDay = (0, dayjs_1.default)(query.createdAt)
                .utc()
                .startOf("day")
                .toDate();
            const endOfDay = (0, dayjs_1.default)(query.createdAt)
                .utc()
                .endOf("day")
                .toDate();
            query.createdAt = {
                $gte: startOfDay,
                $lt: endOfDay,
            };
        }
        const productQuery = new queryBuilder_1.default(product_model_1.Product.find(), query)
            .search(searchFields)
            .filter(excludeFields)
            .sort()
            .fields();
        yield productQuery.paginate();
        result = yield productQuery.modelQuery
            .select("price discount name quantity thumbnail slug")
            .populate([
            {
                path: "brand",
                match: { _id: { $type: "objectId" } },
                select: "name image",
            },
            {
                path: "mainCategory",
                model: "Category",
            },
        ]);
        pagination.total = productQuery.total;
        yield product_queue_1.productQueue.add(product_queue_1.ProductJobName.updateAllProducts, {});
    }
    else {
        const siftQuery = {};
        if (query.searchTerm) {
            siftQuery["$or"] = searchFields.map((field) => ({
                [field]: { $regex: query === null || query === void 0 ? void 0 : query.searchTerm, $options: "i" },
            }));
        }
        if (query.category) {
            query.mainCategory = query.category;
            delete query.categroy;
        }
        if (query.createdBy) {
            query.createdBy = query.createdBy;
        }
        let filteredProducts = redisProducts.filter((0, sift_1.default)(siftQuery));
        if (query.createdAt) {
            const startOfDay = (0, dayjs_1.default)(query.createdAt)
                .startOf("day")
                .toDate();
            const endOfDay = (0, dayjs_1.default)(query.createdAt)
                .endOf("day")
                .toDate();
            filteredProducts = filteredProducts.filter((item) => {
                const createdAt = new Date(item.createdAt);
                return createdAt >= startOfDay && createdAt < endOfDay;
            });
        }
        pagination.total = filteredProducts.length || 0;
        result = filteredProducts.slice(skip, skip + limit);
    }
    return {
        products: result,
        pagination,
    };
});
const getSingleProductFromDB = (id, query) => __awaiter(void 0, void 0, void 0, function* () {
    if (!id) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Please provide product id to get details");
    }
    let select = "";
    if (query === null || query === void 0 ? void 0 : query.select) {
        select = query.select.split(",").join(" ");
    }
    console.log({ select });
    const product = yield product_model_1.Product.findById(id).select(select).lean();
    return product;
});
const getSingleProductBySlugFromDB = (slug) => __awaiter(void 0, void 0, void 0, function* () {
    if (!slug) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Please provide product id to get details");
    }
    const product = yield product_model_1.Product.findOne({ slug }).lean();
    const category = product === null || product === void 0 ? void 0 : product.mainCategory;
    const allCategories = yield category_model_1.Category.find()
        .select("_id name slug parent_id image")
        .lean()
        .exec();
    const categoryMap = new Map(allCategories.map((c) => [c._id.toString(), c]));
    // Function to build category tree using pre-fetched categories
    const buildCategoryTree = (categoryId) => {
        var _a;
        const tree = [];
        let currentId = categoryId === null || categoryId === void 0 ? void 0 : categoryId.toString();
        while (currentId && categoryMap.has(currentId)) {
            const category = categoryMap.get(currentId);
            if (category) {
                tree.unshift({
                    _id: category._id,
                    name: category.name,
                    slug: category.slug,
                });
                currentId = (_a = category.parent_id) === null || _a === void 0 ? void 0 : _a.toString();
            }
        }
        // Log warning if a category or parent was not found
        if (currentId && !categoryMap.has(currentId)) {
            console.warn(`Parent category not found for ID: ${currentId}`);
        }
        return tree;
    };
    const breadcrum = buildCategoryTree(category === null || category === void 0 ? void 0 : category.toString());
    const relatedProducts = yield product_model_1.Product.find({
        "category.id": category,
    })
        .limit(8)
        .lean();
    return {
        product,
        relatedProducts: relatedProducts === null || relatedProducts === void 0 ? void 0 : relatedProducts.filter((p) => p._id !== (product === null || product === void 0 ? void 0 : product._id)),
        breadcrum,
    };
});
const bulkUploadToDB = (file, mapedFields, email) => __awaiter(void 0, void 0, void 0, function* () {
    if (!file) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "No upload file provided");
    }
    const filePath = path_1.default.resolve(file.path);
    const categories = (yield category_model_1.Category.find({ isDeleted: false }).lean()).map((cat) => (Object.assign(Object.assign({}, cat), { _id: cat._id.toString() })));
    const brands = (yield brand_model_1.Brand.find({ isDeleted: false }).lean()).map((brand) => (Object.assign(Object.assign({}, brand), { _id: brand._id.toString() })));
    const user = yield user_model_1.User.isUserExistsByEmail(email);
    const payload = yield new Promise((resolve, reject) => {
        const fileStream = fs_1.default.createReadStream(filePath);
        papaparse_1.default.parse(fileStream, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
            complete: (result) => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b;
                const { data: csvData, errors: csvErrors } = result;
                if (csvErrors.length > 0) {
                    reject(new AppError_1.default(http_status_1.default.CONFLICT, "Failed to read file"));
                    return;
                }
                const filteredData = [];
                for (const data of csvData) {
                    const newData = {
                        name: "",
                        price: 0,
                        special_price: 0,
                        discount: {
                            type: "percent",
                            value: 0,
                        },
                        sku: "",
                        brand: "",
                        model: "",
                        warranty: {
                            days: 0,
                            lifetime: false,
                        },
                        key_features: "",
                        quantity: 0,
                        category: [],
                        description: "",
                        videos: [],
                        gallery: [],
                        thumbnail: "",
                        slug: "",
                        attributes: [],
                        meta: {
                            title: "",
                            description: "",
                            image: "",
                        },
                        tags: [],
                        isFeatured: true,
                        mainCategory: "",
                        shipping: {
                            free: true,
                            cost: 0,
                        },
                    };
                    for (const field of mapedFields) {
                        if (!field.key || !field.value)
                            return;
                        if (product_interface_1.defaultFields.includes(field.value)) {
                            const value = typeof data === "object" &&
                                data[field.key];
                            if (value !== undefined) {
                                if (field.value === "category") {
                                    const cat = categories.find((c) => c.slug === data[field.key] ||
                                        c._id === data[field.key]);
                                    if (cat) {
                                        const productCat = (0, product_utils_1.createCategoryArray)(categories, cat);
                                        newData.category = productCat;
                                        newData.mainCategory = cat._id;
                                    }
                                }
                                else if (field.value === "shipping.cost") {
                                    newData.shipping = newData.shipping || {
                                        free: false,
                                        cost: 0,
                                    };
                                    newData.shipping.cost = Number(value);
                                }
                                else if (field.value === "shipping.free") {
                                    newData.shipping = {
                                        free: String(value).toLowerCase() == "true" ? true : false,
                                        cost: value == "true" ? 0 : ((_a = newData.shipping) === null || _a === void 0 ? void 0 : _a.cost) || 0,
                                    };
                                }
                                else if (field.value === "discount.type") {
                                    newData.discount = newData.discount || {
                                        type: "flat",
                                        value: 0,
                                    };
                                    newData.discount.type = value;
                                }
                                else if (field.value === "discount.value") {
                                    newData.discount = {
                                        type: ((_b = newData.discount) === null || _b === void 0 ? void 0 : _b.type) || "flat",
                                        value: value,
                                    };
                                }
                                else if (field.value === "meta.title") {
                                    newData.meta = newData.meta || {
                                        title: "",
                                        description: "",
                                        image: "",
                                    };
                                    newData.meta.title = value;
                                }
                                else if (field.value === "meta.description") {
                                    newData.meta = newData.meta || {
                                        title: "",
                                        description: "",
                                        image: "",
                                    };
                                    newData.meta.description = value;
                                }
                                else if (field.value === "meta.image") {
                                    newData.meta = newData.meta || {
                                        title: "",
                                        description: "",
                                        image: "",
                                    };
                                    newData.meta.image = value;
                                }
                                else if (field.value === "warranty.days") {
                                    (newData.warranty = newData.warranty || {
                                        days: 0,
                                        lifetime: false,
                                    }),
                                        (newData.warranty.days = value);
                                }
                                else if (field.value === "warranty.lifetime") {
                                    newData.warranty = newData.warranty || {
                                        days: 0,
                                        lifetime: false,
                                    };
                                    newData.warranty.lifetime =
                                        String(value).toLowerCase() == "true" || "TRUE"
                                            ? true
                                            : false;
                                }
                                else if (field.value in newData) {
                                    newData[field.value] = value;
                                }
                                if (field.value === "brand") {
                                    const exist = brands.find((b) => b.name === value || b._id === value);
                                    if (exist) {
                                        newData.brand = exist._id || "add brand";
                                    }
                                }
                                // console.log({ key: field.value, value });
                                newData.slug = (0, slugify_1.default)(newData.name);
                                newData.sku = (0, slugify_1.default)(newData.name);
                                newData.createdBy = user._id;
                                newData.special_price = (0, product_utils_1.claculateSpecialPrice)(newData.discount, Number(newData.price));
                            }
                        }
                    }
                    // console.log({ newData });
                    filteredData.push((0, product_utils_1.transformSvgProductData)(newData));
                }
                resolve(filteredData);
            }),
            error: (err) => {
                console.log(err);
                reject(new AppError_1.default(http_status_1.default.CONFLICT, `Error parsing file: ${err.message}`));
            },
        });
    });
    if (payload.length === 0 || !payload) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Failed to parse data. Pelase map all the fields properly");
    }
    const withError = [];
    const successData = [];
    for (const record of payload) {
        try {
            const res = yield product_model_1.Product.create(record);
            if (res) {
                successData.push({
                    name: record.name,
                    slug: record.slug,
                    sku: record.sku,
                    _id: res._id,
                });
            }
        }
        catch (err) {
            if (err.code === 11000) {
                const simplifiedError = (0, handleDuplicateError_1.default)(err);
                withError.push({
                    name: record.name,
                    errorSources: simplifiedError.errorSources,
                    data: record,
                });
            }
            else if (err instanceof mongoose_1.Error.CastError) {
                withError.push({
                    name: record.name,
                    errorSources: [
                        {
                            path: err === null || err === void 0 ? void 0 : err.path,
                            message: err.message || "Failed to create product",
                        },
                    ],
                    data: record,
                });
            }
            else if (err instanceof mongoose_1.Error.ValidationError) {
                const errorSources = [];
                Object.keys(err.errors).map((key) => {
                    errorSources.push({
                        path: key,
                        message: err.errors[key].message,
                    });
                });
                withError.push({
                    name: record.name,
                    errorSources,
                    data: record,
                });
            }
            else {
                withError.push({
                    name: record.name,
                    errorSources: [
                        {
                            path: "",
                            message: "Failed to create product",
                        },
                    ],
                    data: record,
                });
            }
        }
    }
    try {
        const bulkResult = yield bulkUpload_model_1.default.create({
            withError,
            successData,
            createdBy: user._id,
        });
    }
    catch (err) {
        // throw new AppError(httpStatus.CONFLICT, 'Failed to store bulk upload history')
    }
    yield product_queue_1.productQueue.add(product_queue_1.ProductJobName.updateAllProducts, {});
    const result = {
        withError,
        successData,
        createdBy: user._id,
    };
    return result;
});
const bulkUploadJsonToDB = (file, email) => __awaiter(void 0, void 0, void 0, function* () {
    if (!file) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "No upload file provided");
    }
    if (!file.mimetype.includes("application/json") &&
        !file.originalname.endsWith(".json")) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "File must be a JSON file");
    }
    const filePath = path_1.default.resolve(file.path);
    const user = yield user_model_1.User.isUserExistsByEmail(email);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    const categories = (yield category_model_1.Category.find({ isDeleted: false }).lean()).map((cat) => (Object.assign(Object.assign({}, cat), { _id: cat._id.toString() })));
    const brands = (yield brand_model_1.Brand.find({ isDeleted: false }).lean()).map((brand) => (Object.assign(Object.assign({}, brand), { _id: brand._id.toString() })));
    let payload = [];
    try {
        const fileContent = fs_1.default.readFileSync(filePath, "utf-8");
        const jsonData = JSON.parse(fileContent);
        if (!Array.isArray(jsonData)) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, "JSON file must contain an array of products");
        }
        payload = jsonData.map((data) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
            const newData = {
                name: data.name || "",
                price: Number(data.price) || 0,
                special_price: Number(data.special_price) || 0,
                discount: {
                    type: ((_a = data.discount) === null || _a === void 0 ? void 0 : _a.type) || "percent",
                    value: Number((_b = data.discount) === null || _b === void 0 ? void 0 : _b.value) || 0,
                },
                filters: (data === null || data === void 0 ? void 0 : data.filters) || [],
                sku: data.sku || (0, slugify_1.default)(data.name || "", { lower: true }),
                brand: "",
                model: data.model || "",
                warranty: {
                    days: Number((_c = data.warranty) === null || _c === void 0 ? void 0 : _c.days) || 0,
                    lifetime: Boolean((_d = data.warranty) === null || _d === void 0 ? void 0 : _d.lifetime) || false,
                },
                key_features: data.key_features || "",
                quantity: Number(data.quantity) || 0,
                category: [],
                description: data.description || "",
                videos: Array.isArray(data.videos) ? data.videos : [],
                gallery: Array.isArray(data.gallery) ? data.gallery : [],
                thumbnail: data.thumbnail || "",
                slug: (0, slugify_1.default)(data.name || "", { lower: true }),
                attributes: Array.isArray(data.attributes) ? data.attributes : [],
                meta: {
                    title: ((_e = data.meta) === null || _e === void 0 ? void 0 : _e.title) || "",
                    description: ((_f = data.meta) === null || _f === void 0 ? void 0 : _f.description) || "",
                    image: ((_g = data.meta) === null || _g === void 0 ? void 0 : _g.image) || "",
                },
                tags: Array.isArray(data.tags) ? data.tags : [],
                isFeatured: (_h = Boolean(data.isFeatured)) !== null && _h !== void 0 ? _h : true,
                mainCategory: "",
                shipping: {
                    free: (_k = Boolean((_j = data.shipping) === null || _j === void 0 ? void 0 : _j.free)) !== null && _k !== void 0 ? _k : true,
                    cost: Number((_l = data.shipping) === null || _l === void 0 ? void 0 : _l.cost) || 0,
                },
                createdBy: user._id,
                isPublished: (_m = Boolean(data.isPublished)) !== null && _m !== void 0 ? _m : true,
                isDeleted: (_o = Boolean(data.isDeleted)) !== null && _o !== void 0 ? _o : false,
                sales: Number(data.sales) || 0,
            };
            console.log(data);
            // Handle category
            if (data.category) {
                const cat = categories.find((c) => c.slug.trim() === data.category.trim() ||
                    c._id === data.category.trim());
                if (cat) {
                    newData.category = (0, product_utils_1.createCategoryArray)(categories, cat);
                    newData.mainCategory = cat._id;
                }
                else {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Invalid category: ${data.category}`);
                }
            }
            else {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Category is required");
            }
            // Handle brand
            if (data.brand) {
                const exist = brands.find((b) => b.name === data.brand || b._id === data.brand);
                if (exist) {
                    newData.brand = exist._id;
                }
                else {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Invalid brand: ${data.brand}`);
                }
            }
            else {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Brand is required");
            }
            return (0, product_utils_1.transformSvgProductData)(newData);
        });
    }
    catch (err) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, `${err.message}`);
    }
    if (payload.length === 0) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "No valid data parsed from the JSON file");
    }
    const withError = [];
    const successData = [];
    for (const record of payload) {
        try {
            const res = yield product_model_1.Product.create(record);
            if (res) {
                successData.push({
                    name: record.name,
                    slug: record.slug,
                    sku: record.sku,
                    _id: res._id,
                });
            }
        }
        catch (err) {
            if (err.code === 11000) {
                const simplifiedError = (0, handleDuplicateError_1.default)(err);
                withError.push({
                    name: record.name,
                    errorSources: simplifiedError.errorSources,
                    data: record,
                });
            }
            else if (err instanceof mongoose_1.Error.CastError) {
                withError.push({
                    name: record.name,
                    errorSources: [
                        {
                            path: err.path,
                            message: err.message || "Failed to create product",
                        },
                    ],
                    data: record,
                });
            }
            else if (err instanceof mongoose_1.Error.ValidationError) {
                const errorSources = Object.keys(err.errors).map((key) => ({
                    path: key,
                    message: err.errors[key].message,
                }));
                withError.push({
                    name: record.name,
                    errorSources,
                    data: record,
                });
            }
            else {
                withError.push({
                    name: record.name,
                    errorSources: [
                        { path: "", message: err.message || "Failed to create product" },
                    ],
                    data: record,
                });
            }
        }
    }
    try {
        yield bulkUpload_model_1.default.create({
            withError,
            successData,
            createdBy: user._id,
        });
    }
    catch (err) {
        console.error("Failed to store bulk upload history:", err);
    }
    yield product_queue_1.productQueue.add(product_queue_1.ProductJobName.updateAllProducts, {});
    const result = {
        withError,
        successData,
        createdBy: user._id,
    };
    return result;
});
const downloadJsonTemplate = (_a) => __awaiter(void 0, [_a], void 0, function* ({ category, filters, }) {
    const attributes = [];
    let mainCategory = "";
    if (category && mongoose_1.default.isValidObjectId(category)) {
        const data = yield category_model_1.Category.findById(category)
            .populate("product_details_categories")
            .lean();
        if (data) {
            mainCategory = data.slug;
            for (const attr of data === null || data === void 0 ? void 0 : data.product_details_categories) {
                const fields = {};
                for (const f of attr === null || attr === void 0 ? void 0 : attr.fields) {
                    fields[f] = "";
                }
                attributes.push({
                    name: attr.name,
                    fields: fields,
                });
            }
        }
    }
    let filterData = [];
    if (filters) {
        filterData = yield filter_model_1.default.find({ _id: { $in: filters } });
    }
    // Sample product data for the template
    const templateData = [
        {
            name: "",
            price: 0,
            discount: { type: "percent", value: 0 },
            sku: "",
            brand: "",
            model: "",
            warranty: { days: 0, lifetime: false },
            key_features: "",
            quantity: 0,
            category: mainCategory,
            description: "",
            videos: [],
            filters: filterData.map((f) => ({
                filter: f === null || f === void 0 ? void 0 : f._id,
                fitlerId: f.filterId,
                value: "",
            })),
            gallery: [],
            thumbnail: "",
            meta: {
                title: "",
                description: "",
                image: "",
            },
            tags: [],
            isFeatured: true,
            shipping: { free: false, cost: 0 },
            isPublished: true,
            attributes,
        },
    ];
    // Convert to JSON string with formatting
    const jsonContent = JSON.stringify({ templateData, filters: filterData }, null, 2);
    return jsonContent;
});
const updateProductIntoDB = (id, payload, thisUser) => __awaiter(void 0, void 0, void 0, function* () {
    if (!id) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Please provide product id");
    }
    const exist = yield product_model_1.Product.findById(id);
    if (!exist) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Product does not exist");
    }
    const result = yield product_model_1.Product.findByIdAndUpdate(id, payload, { new: true });
    yield product_queue_1.productQueue.add(product_queue_1.ProductJobName.updateSingleProduct, result === null || result === void 0 ? void 0 : result._id);
    if (result) {
        if (!thisUser || !thisUser._id) {
            return;
        }
        const notifications = yield (0, notificaiton_utils_1.buildNotifications)({
            source: result._id,
            text: "updated a product",
            thisUser,
            notificationType: "product",
            actionType: "update",
        });
        yield (0, notificaiton_utils_1.addNotifications)({ notifications, userFrom: thisUser });
    }
    return result;
});
const getFeaturedProductFromDB = (queryLimit) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = queryLimit ? Number(queryLimit) : 18;
    const products = yield product_model_1.Product.find({ isFeatured: true })
        .sort("-updatedAt")
        .limit(Number(limit) || 18);
    return products;
});
const getProductByCategory = (slug, query) => __awaiter(void 0, void 0, void 0, function* () {
    const catExist = yield category_model_1.Category.findOne({ slug, isDeleted: false }).select("_id slug name description");
    const parsedFilters = (0, product_utils_1.parseFilters)(query.filter);
    const pagination = {
        total: 0,
        currentPage: query.page ? Number(query.page) : 1,
        limit: query.limit ? Number(query.limit) : 10,
    };
    if (!catExist) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Category does not exist");
    }
    const categoryQuery = (0, product_utils_1.buildProductQuery)(catExist._id.toString(), parsedFilters);
    // Get paginated products
    const products = yield product_model_1.Product.find(categoryQuery)
        .select("price discount name quantity thumbnail slug shipping")
        .skip((pagination.currentPage - 1) * pagination.limit)
        .limit(pagination.limit)
        .lean();
    const total = yield product_model_1.Product.countDocuments(categoryQuery);
    const allCategoryProducts = yield product_model_1.Product.find({
        "category.id": catExist._id,
    })
        .select("filters")
        .lean();
    const commonFilters = (0, product_utils_1.extractCommonFilters)(allCategoryProducts);
    let filters = [];
    for (let filter of commonFilters) {
        const data = yield filter_model_1.default.findById(filter.filter);
        if (data) {
            filters.push(data);
        }
    }
    pagination.total = total;
    const allCategories = yield category_model_1.Category.find()
        .select("_id name slug parent_id image")
        .lean()
        .exec();
    const categoryMap = new Map(allCategories.map((c) => [c._id.toString(), c]));
    // Function to build category tree using pre-fetched categories
    const buildCategoryTree = (categoryId) => {
        var _a;
        const tree = [];
        let currentId = categoryId === null || categoryId === void 0 ? void 0 : categoryId.toString();
        while (currentId && categoryMap.has(currentId)) {
            const category = categoryMap.get(currentId);
            if (category) {
                tree.unshift({
                    _id: category._id,
                    name: category.name,
                    slug: category.slug,
                });
                currentId = (_a = category.parent_id) === null || _a === void 0 ? void 0 : _a.toString();
            }
        }
        // Log warning if a category or parent was not found
        if (currentId && !categoryMap.has(currentId)) {
            console.warn(`Parent category not found for ID: ${currentId}`);
        }
        return tree;
    };
    const buildChildTree = (categoryId) => {
        const tree = [];
        const queue = [categoryId === null || categoryId === void 0 ? void 0 : categoryId.toString()];
        const visited = new Set();
        while (queue.length > 0) {
            const currentId = queue.shift();
            if (!currentId || visited.has(currentId))
                continue;
            visited.add(currentId);
            const category = categoryMap.get(currentId);
            if (!category) {
                console.warn(`Child category not found for ID: ${currentId}`);
                continue;
            }
            if (category._id.toString() !== catExist._id.toString()) {
                tree.push({
                    _id: category._id,
                    name: category.name,
                    slug: category.slug,
                    image: category.image,
                    description: category === null || category === void 0 ? void 0 : category.description,
                });
            }
            // Find all children of the current category
            const children = allCategories.filter((c) => { var _a; return ((_a = c.parent_id) === null || _a === void 0 ? void 0 : _a.toString()) === currentId; });
            queue.push(...children.map((c) => c._id.toString()));
        }
        return tree;
    };
    const categoryTree = buildCategoryTree(catExist._id.toString());
    const childTree = buildChildTree(catExist._id.toString());
    const data = {
        products,
        filters,
        categoryTree,
        childTree,
        category: catExist,
    };
    return {
        result: data,
        pagination,
    };
});
const getSearchProductsFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const filters = {};
    const catFilters = {};
    const brandFilters = {};
    let sort = { createdAt: -1 };
    const getFrom = query.getFrom ? (_a = query.getFrom) === null || _a === void 0 ? void 0 : _a.split(",") : [];
    if (query === null || query === void 0 ? void 0 : query.search) {
        filters["$or"] = [
            { name: { $regex: query.search, $options: "i" } },
            { model: { $regex: query.search, $options: "i" } },
        ];
        catFilters["$or"] = [{ name: { $regex: query.search, $options: "i" } }];
        brandFilters["$and"] = [{ isDeleted: false }];
        brandFilters["$or"] = [{ name: { $regex: query.search, $options: "i" } }];
        brandFilters["$and"] = [{ isDeleted: false }, { isActive: true }];
    }
    const redisProducts = yield (0, product_redis_1.getProductsFromRedis)();
    let products = [];
    if (!redisProducts || (redisProducts === null || redisProducts === void 0 ? void 0 : redisProducts.length) === 0) {
        products = yield product_model_1.Product.find(filters)
            .select("slug _id name thumbnail")
            .sort(sort)
            .limit(15);
    }
    else {
        const filterProducts = redisProducts.filter((0, sift_1.default)(filters));
        products = filterProducts.slice(0, 15);
    }
    let categories = [];
    if (getFrom === null || getFrom === void 0 ? void 0 : getFrom.includes("category")) {
        categories = yield category_model_1.Category.find(catFilters)
            .select("slug _id name description image")
            .sort(sort)
            .limit(10);
    }
    let brands = [];
    if (getFrom === null || getFrom === void 0 ? void 0 : getFrom.includes("brand")) {
        brands = yield brand_model_1.Brand.find(brandFilters)
            .select("_id name image")
            .sort(sort)
            .limit(10);
    }
    return {
        products,
        categories,
        brands,
    };
});
const getStaticProductSlugsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield product_model_1.Product.find({ sort: { createdAt: -1 } })
        .limit(500)
        .select("slug");
    return result;
});
const getPcBuilderProductsFromDB = (id, query) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const pcBuilderSettings = yield settings_model_1.default.findOne();
    const pcBuilder = pcBuilderSettings === null || pcBuilderSettings === void 0 ? void 0 : pcBuilderSettings.pcBuilder;
    const page = (query === null || query === void 0 ? void 0 : query.page) ? Number(query.page) : 1;
    const limit = (query === null || query === void 0 ? void 0 : query.limit) ? Number(query === null || query === void 0 ? void 0 : query.limit) : 20;
    const skip = (page - 1) * limit;
    if (!pcBuilder) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "PC builder settigns not found");
    }
    const allParts = [
        ...(_a = pcBuilder.coreComponents) === null || _a === void 0 ? void 0 : _a.parts,
        ...(_b = pcBuilder.peripherals) === null || _b === void 0 ? void 0 : _b.parts,
    ];
    const partCategory = (_c = allParts === null || allParts === void 0 ? void 0 : allParts.find((p) => p.id.toString() === id)) === null || _c === void 0 ? void 0 : _c.category;
    if (!partCategory) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Category for this part not found");
    }
    const categoryQuery = {
        $or: [
            {
                mainCategory: new mongodb_1.ObjectId(partCategory),
            },
            {
                "category.id": new mongodb_1.ObjectId(partCategory),
            },
        ],
    };
    const filters = yield product_model_1.Product.find(categoryQuery).distinct("filters");
    const products = yield product_model_1.Product.find(categoryQuery)
        .sort("createdAt")
        .skip(skip)
        .limit(limit);
    const total = yield product_model_1.Product.countDocuments(categoryQuery);
    return { products, filters, pagination: { total, currentPage: page, limit } };
});
exports.ProductServices = {
    createProductIntoDB,
    getAllProductsFromDB,
    bulkUploadToDB,
    getSingleProductFromDB,
    updateProductIntoDB,
    getFeaturedProductFromDB,
    getProductByCategory,
    getSingleProductBySlugFromDB,
    getSearchProductsFromDB,
    downloadJsonTemplate,
    getStaticProductSlugsFromDB,
    bulkUploadJsonToDB,
    getPcBuilderProductsFromDB,
};
