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
const mongoose_1 = __importDefault(require("mongoose"));
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const category_model_1 = require("../app/modules/category/category.model");
const brand_model_1 = require("../app/modules/brand/brand.model");
const filter_model_1 = __importDefault(require("../app/modules/productFilters/filter.model"));
const product_model_1 = require("../app/modules/product/product.model");
// MongoDB connection string - replace with your own
const MONGODB_URI = "mongodb+srv://khanmahmud994:drRbocuiwCAemjrg@cluster0.mfx2a.mongodb.net/IT_shop_test?retryWrites=true&w=majority&appName=Cluster0";
// Category hierarchy data (IT-focused, based on Star Tech and TechLand BD structures)
const categoriesData = [
    // Main categories
    {
        name: "Laptops",
        slug: "laptops",
        parent_id: null,
        isFeatured: true,
        product_details_categories: [],
    },
    {
        name: "Desktop PCs",
        slug: "desktop-pcs",
        parent_id: null,
        isFeatured: true,
        product_details_categories: [],
    },
    {
        name: "Gaming PCs",
        slug: "gaming-pcs",
        parent_id: null,
        isFeatured: true,
        product_details_categories: [],
    },
    {
        name: "Monitors",
        slug: "monitors",
        parent_id: null,
        isFeatured: false,
        product_details_categories: [],
    },
    {
        name: "Components",
        slug: "components",
        parent_id: null,
        isFeatured: false,
        product_details_categories: [],
    },
    {
        name: "Accessories",
        slug: "accessories",
        parent_id: null,
        isFeatured: false,
        product_details_categories: [],
    },
    {
        name: "Mobiles",
        slug: "mobiles",
        parent_id: null,
        isFeatured: true,
        product_details_categories: [],
    },
    {
        name: "Gadgets",
        slug: "gadgets",
        parent_id: null,
        isFeatured: true,
        product_details_categories: [],
    },
    {
        name: "Home Appliances",
        slug: "home-appliances",
        parent_id: null,
        isFeatured: false,
        product_details_categories: [],
    },
    {
        name: "Office Equipment",
        slug: "office-equipment",
        parent_id: null,
        isFeatured: false,
        product_details_categories: [],
    },
    // Subcategories under Laptops
    {
        name: "Gaming Laptops",
        slug: "gaming-laptops",
        parent_id: "laptops",
        product_details_categories: [],
    },
    {
        name: "Ultrabooks",
        slug: "ultrabooks",
        parent_id: "laptops",
        product_details_categories: [],
    },
    {
        name: "Business Laptops",
        slug: "business-laptops",
        parent_id: "laptops",
        product_details_categories: [],
    },
    // Subcategories under Desktop PCs
    {
        name: "All-in-One PCs",
        slug: "all-in-one-pcs",
        parent_id: "desktop-pcs",
        product_details_categories: [],
    },
    {
        name: "Mini PCs",
        slug: "mini-pcs",
        parent_id: "desktop-pcs",
        product_details_categories: [],
    },
    // Subcategories under Gaming PCs
    {
        name: "Custom Builds",
        slug: "custom-builds",
        parent_id: "gaming-pcs",
        product_details_categories: [],
    },
    // Subcategories under Components
    {
        name: "Graphics Cards",
        slug: "graphics-cards",
        parent_id: "components",
        product_details_categories: [],
    },
    {
        name: "Processors",
        slug: "processors",
        parent_id: "components",
        product_details_categories: [],
    },
    {
        name: "RAM",
        slug: "ram",
        parent_id: "components",
        product_details_categories: [],
    },
    {
        name: "Storage",
        slug: "storage",
        parent_id: "components",
        product_details_categories: [],
    },
    // Subcategories under Accessories
    {
        name: "Keyboards",
        slug: "keyboards",
        parent_id: "accessories",
        product_details_categories: [],
    },
    {
        name: "Mice",
        slug: "mice",
        parent_id: "accessories",
        product_details_categories: [],
    },
    // Subcategories under Mobiles
    {
        name: "Smartphones",
        slug: "smartphones",
        parent_id: "mobiles",
        product_details_categories: [],
    },
    {
        name: "Feature Phones",
        slug: "feature-phones",
        parent_id: "mobiles",
        product_details_categories: [],
    },
    // Subcategories under Gadgets
    {
        name: "Smart Watches",
        slug: "smart-watches",
        parent_id: "gadgets",
        product_details_categories: [],
    },
    {
        name: "Earbuds",
        slug: "earbuds",
        parent_id: "gadgets",
        product_details_categories: [],
    },
    {
        name: "Drones",
        slug: "drones",
        parent_id: "gadgets",
        product_details_categories: [],
    },
    // Subcategories under Home Appliances
    {
        name: "Air Conditioners",
        slug: "air-conditioners",
        parent_id: "home-appliances",
        product_details_categories: [],
    },
    {
        name: "Refrigerators",
        slug: "refrigerators",
        parent_id: "home-appliances",
        product_details_categories: [],
    },
    // Subcategories under Office Equipment
    {
        name: "Printers",
        slug: "printers",
        parent_id: "office-equipment",
        product_details_categories: [],
    },
    {
        name: "Scanners",
        slug: "scanners",
        parent_id: "office-equipment",
        product_details_categories: [],
    },
];
// Brands data (extracted and expanded from provided documents and similar sites)
const brandsData = [
    "Gree",
    "AMD",
    "XINJI",
    "AOC",
    "HPE",
    "Samsung",
    "DJI",
    "Black Shark",
    "Razer",
    "Sony",
    "HP",
    "Dell",
    "Apple",
    "Asus",
    "Acer",
    "Lenovo",
    "Microsoft",
    "MSI",
    "Gigabyte",
    "Infinix",
    "Walton",
    "Xiaomi",
    "Huawei",
    "Chuwi",
    "Intel",
    "NVIDIA",
    "Logitech",
    "Corsair",
    "SteelSeries",
    "Redragon",
    "Cooler Master",
    "Fantech",
    "DeepCool",
    "Cougar",
    "Elgato",
    "PNY",
    "ASRock",
    "Zadak",
    "GALAX",
    "Noctua",
    "Antec",
    "Lian Li",
    "CRYORIG",
    "EKWB",
    "Gamdias",
    "KWG",
    "XFX",
    "Motorola",
    "Google",
    "Vivo",
    "OPPO",
    "Realme",
    "OnePlus",
    "LG",
    "Hitachi",
    "Whirlpool",
    "Singer",
    "Haier",
    "Anker",
    "Micropack",
    "Vention",
    "Fire-Boltt",
    "UGREEN",
    "Baseus",
    "Orico",
    "Havit",
    "HOCO",
    "Blackmagic",
    "Zhiyun",
    "Gudsen",
    "Loupedeck",
];
// Filters data (IT-specific filters for products)
const filtersData = [
    {
        filterId: 1,
        title: "Screen Size",
        options: [
            { value: "13 inch" },
            { value: "14 inch" },
            { value: "15.6 inch" },
            { value: "17 inch" },
            { value: "24 inch" },
            { value: "27 inch" },
            { value: "32 inch" },
        ],
    },
    {
        filterId: 2,
        title: "RAM",
        options: [
            { value: "4GB" },
            { value: "8GB" },
            { value: "16GB" },
            { value: "32GB" },
            { value: "64GB" },
        ],
    },
    {
        filterId: 3,
        title: "Storage",
        options: [
            { value: "256GB SSD" },
            { value: "512GB SSD" },
            { value: "1TB SSD" },
            { value: "2TB SSD" },
            { value: "1TB HDD" },
        ],
    },
    {
        filterId: 4,
        title: "Processor",
        options: [
            { value: "Intel Core i3" },
            { value: "Intel Core i5" },
            { value: "Intel Core i7" },
            { value: "AMD Ryzen 3" },
            { value: "AMD Ryzen 5" },
            { value: "AMD Ryzen 7" },
        ],
    },
    {
        filterId: 5,
        title: "Graphics",
        options: [
            { value: "Integrated" },
            { value: "NVIDIA GTX 1650" },
            { value: "NVIDIA RTX 3060" },
            { value: "AMD Radeon" },
        ],
    },
    {
        filterId: 6,
        title: "Battery Life",
        options: [
            { value: "6 hours" },
            { value: "8 hours" },
            { value: "10 hours" },
            { value: "12+ hours" },
        ],
    },
    {
        filterId: 7,
        title: "Color",
        options: [
            { value: "Black" },
            { value: "Silver" },
            { value: "Gray" },
            { value: "White" },
        ],
    },
];
// Scraping configuration - URLs from similar sites (Star Tech and TechLand BD)
const scrapeUrls = [
    "https://www.startech.com.bd/desktops",
    "https://www.startech.com.bd/special-pc",
    "https://www.startech.com.bd/monitor",
    "https://www.startech.com.bd/mobile-phone",
    "https://www.startech.com.bd/component",
    "https://www.startech.com.bd/desktops/all-in-one-pc",
    "https://www.startech.com.bd/laptop-notebook",
    "https://www.startech.com.bd/tablet-pc",
    "https://www.startech.com.bd/component/processor",
    "https://www.startech.com.bd/appliance",
];
// Function to insert categories recursively (handling nesting)
function insertCategories() {
    return __awaiter(this, void 0, void 0, function* () {
        for (const catData of categoriesData) {
            const parent = catData.parent_id
                ? yield category_model_1.Category.findOne({ slug: catData.parent_id })
                : null;
            const category = new category_model_1.Category(Object.assign(Object.assign({}, catData), { parent_id: parent ? parent._id : null, createdBy: "script" }));
            yield category.save();
            console.log(`Inserted category: ${catData.name}`);
        }
    });
}
// Function to insert brands
function insertBrands() {
    return __awaiter(this, void 0, void 0, function* () {
        for (const brandName of brandsData) {
            const existing = yield brand_model_1.Brand.findOne({ name: brandName });
            if (!existing) {
                const brand = new brand_model_1.Brand({
                    name: brandName,
                    image: "", // Can be added later
                    createdBy: "script",
                });
                yield brand.save();
                console.log(`Inserted brand: ${brandName}`);
            }
        }
    });
}
// Function to insert filters
function insertFilters() {
    return __awaiter(this, void 0, void 0, function* () {
        for (const filterData of filtersData) {
            const existing = yield filter_model_1.default.findOne({ title: filterData.title });
            if (!existing) {
                const filter = new filter_model_1.default({
                    filterId: filterData.filterId,
                    title: filterData.title,
                    options: filterData.options.map((opt, index) => ({
                        optionId: index + 1,
                        value: opt.value,
                    })),
                });
                yield filter.save();
                console.log(`Inserted filter: ${filterData.title}`);
            }
        }
    });
}
// Function to scrape and insert products
// Function to scrape and insert products
function scrapeAndInsertProducts() {
    return __awaiter(this, void 0, void 0, function* () {
        let productCount = 0;
        for (const url of scrapeUrls) {
            try {
                const response = yield axios_1.default.get(url, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                    },
                    timeout: 10000,
                });
                const $ = cheerio.load(response.data);
                // Generic selectors based on Star Tech structure (adjust if needed for TechLand)
                // Collect promises instead of using .each()
                const scrapePromises = $(".product-item, .product-card, article, .item")
                    .map((index, element) => {
                    return () => __awaiter(this, void 0, void 0, function* () {
                        var _a;
                        try {
                            const name = $(element)
                                .find(".product-title, h3, .title, a")
                                .first()
                                .text()
                                .trim() || `Sample Product ${index}`;
                            const priceStr = $(element)
                                .find(".price-current, .price, .amount")
                                .first()
                                .text()
                                .trim();
                            const price = parseFloat(priceStr.replace(/[^\d.]/g, "")) ||
                                Math.floor(Math.random() * 100000) + 10000; // Fallback random price
                            const brandName = $(element)
                                .find(".brand, .manufacturer")
                                .first()
                                .text()
                                .trim() ||
                                brandsData[Math.floor(Math.random() * brandsData.length)];
                            const categorySlug = ((_a = url.split("/").pop()) === null || _a === void 0 ? void 0 : _a.replace(/-/g, " ")) || "laptops"; // Infer category from URL
                            const image = $(element).find("img").first().attr("src") || "";
                            const brand = yield brand_model_1.Brand.findOne({ name: brandName });
                            if (!brand)
                                return; // Skip if brand not found
                            const category = yield category_model_1.Category.findOne({ slug: categorySlug });
                            if (!category)
                                return; // Skip if category not found
                            const mainCategory = (yield category_model_1.Category.findOne({
                                slug: categorySlug.split(" ")[0],
                            })) || category; // Fallback
                            // Generate SKU
                            const sku = `${brandName.toUpperCase()}-${name
                                .substring(0, 10)
                                .replace(/\s+/g, "")}-${Date.now() + index}`;
                            // Random discount (0-20%)
                            const discountPercent = Math.floor(Math.random() * 21);
                            const specialPrice = price * (1 - discountPercent / 100);
                            // Sample key features and description
                            const keyFeatures = "High performance, Latest processor, Ample storage, Sleek design.";
                            const description = `A premium ${name} from ${brandName}. Ideal for gaming and productivity.`;
                            // Random filters (assign 2-3)
                            const filterDocs = yield filter_model_1.default.find({}).limit(3);
                            const filters = filterDocs.flatMap((f) => f.options.slice(0, 1).map((opt) => ({
                                filterId: f.filterId,
                                value: opt.value,
                                filter: f.title,
                            })));
                            const product = new product_model_1.Product({
                                name,
                                price,
                                discount: specialPrice > 0
                                    ? { type: "percent", value: discountPercent }
                                    : undefined,
                                sku,
                                brand: brand._id,
                                model: name.split(" ").slice(-2).join(" "),
                                warranty: { days: Math.floor(Math.random() * 365) + 30 }, // Random 1-12 months
                                key_features: keyFeatures,
                                quantity: Math.floor(Math.random() * 100) + 10,
                                category: [{ main: true, id: category._id.toString() }],
                                description,
                                videos: [],
                                gallery: [image],
                                thumbnail: image,
                                slug: name.toLowerCase().replace(/\s+/g, "-").substring(0, 50),
                                attributes: [{ name: "Weight", fields: { kg: "1.5" } }], // Sample attribute
                                meta: {
                                    title: name,
                                    description: description.substring(0, 160),
                                    image,
                                },
                                tags: ["new", "popular"],
                                isFeatured: Math.random() > 0.8,
                                sales: Math.floor(Math.random() * 50),
                                filters,
                                mainCategory: mainCategory._id,
                                createdBy: "script",
                                shipping: {
                                    free: Math.random() > 0.7,
                                    cost: Math.random() > 0.7 ? 0 : 200,
                                },
                            });
                            yield product.save();
                            console.log(`Inserted product ${++productCount}: ${name} - ${price}৳`);
                        }
                        catch (err) {
                            console.error(`Error processing product ${index}:`, err.message);
                        }
                    });
                })
                    .get(); // .get() converts Cheerio to array of elements
                // Await all scraping/insert promises
                yield Promise.all(scrapePromises.map((p) => p()));
                // Delay to avoid rate limiting
                yield new Promise((resolve) => setTimeout(resolve, 2000));
            }
            catch (error) {
                console.error(`Error scraping ${url}:`, error.message);
            }
        }
        console.log(`Total products inserted: ${productCount}`);
    });
}
// Main execution
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(MONGODB_URI);
            console.log("Connected to MongoDB");
            yield filter_model_1.default.collection.drop();
            yield product_model_1.Product.collection.drop();
            yield brand_model_1.Brand.collection.drop();
            yield category_model_1.Category.collection.drop();
            // Step 1: Insert categories
            yield insertCategories();
            // Step 2: Insert brands
            yield insertBrands();
            // Step 3: Insert filters
            yield insertFilters();
            // Step 4: Scrape and insert products (aiming for thousands by paginating if needed)
            // Note: To get thousands, add pagination logic (e.g., loop over ?page=1 to ?page=50)
            // For now, this scrapes main pages; extend with pagination URLs like `${url}?page=${i}`
            yield scrapeAndInsertProducts();
            console.log("Population complete!");
        }
        catch (error) {
            console.error("Error:", error);
        }
        finally {
            yield mongoose_1.default.disconnect();
        }
    });
}
main();
