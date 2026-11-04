import assert from "node:assert/strict";

// Runs storefront services against the dev database and a local test Redis.
process.env.REDIS_URL = process.env.TEST_REDIS_URL || "redis://127.0.0.1:6390";
process.env.CLIENT_URL = "";
process.env.REVALIDATE_SECRET = "";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const run = async () => {
  const mongoose = (await import("mongoose")).default;
  const config = (await import("../app/config")).default;
  const { default: redisClient } = await import("../redis");
  const { ProductServices } = await import(
    "../app/modules/product/product.service"
  );
  const { Product } = await import("../app/modules/product/product.model");
  const { Category } = await import("../app/modules/category/category.model");

  assert.ok(
    String(config.database_url).includes("_dev"),
    "refusing to run outside the dev database",
  );
  await mongoose.connect(config.database_url as string);
  await sleep(300);
  await redisClient.flushdb();
  const ok = (name: string) => console.log(`OK  ${name}`);

  const categories = await Category.find({ isDeleted: false })
    .select("slug")
    .limit(2)
    .lean();
  assert.equal(categories.length, 2, "need two categories");
  const [catA, catB] = categories.map((c) => c.slug as string);

  await ProductServices.getProductByCategoryFromDB(catA, { slug: catB });
  const b = (await ProductServices.getProductByCategoryFromDB(catB, {})) as {
    result: { category: { slug: string } };
  };
  assert.equal(b.result.category.slug, catB);
  ok("query param cannot override path param in key");

  const mixed = await Product.findOne({ slug: /[A-Z]/ }).select("slug").lean();
  if (mixed && mixed.slug !== mixed.slug.toLowerCase()) {
    await ProductServices.getSingleProductBySlugFromDB(mixed.slug.toLowerCase());
    const real = (await ProductServices.getSingleProductBySlugFromDB(
      mixed.slug,
    )) as { product: unknown };
    assert.ok(real.product, "mixed-case slug served a cached null");
    ok("slug lookups stay case-sensitive");
  } else {
    console.log("SKIP slug case (no mixed-case slug in dev data)");
  }

  const { Brand } = await import("../app/modules/brand/brand.model");
  const brand = await Brand.findOne({ isDeleted: false }).select("_id").lean();
  assert.ok(brand, "need a brand");
  const brandId = String(brand._id);
  await ProductServices.getProductsByBrandFromDB(brandId, { junk: "1" });
  await ProductServices.getProductsByBrandFromDB(brandId, { junk: "2" });
  await ProductServices.getProductsByBrandFromDB(brandId, {});
  const brandKeys = await redisClient.keys("cache:products:v*:brand:*");
  assert.equal(brandKeys.length, 1, `unknown params created ${brandKeys.length} keys`);
  ok("unknown query params do not create keys");

  await ProductServices.getProductsByBrandFromDB(brandId, { limit: "100000" });
  await ProductServices.getProductsByBrandFromDB(brandId, { limit: "100" });
  const limitKeys = await redisClient.keys("cache:products:v*:brand:*limit*");
  assert.equal(limitKeys.length, 1, "limit is not clamped");
  ok("limit is clamped");

  const s1 = await ProductServices.getSearchProductsFromDB({ search: "  RAM " });
  const s2 = await ProductServices.getSearchProductsFromDB({ search: "ram" });
  assert.equal(JSON.stringify(s1), JSON.stringify(s2));
  const searchKeys = await redisClient.keys("cache:products:v*:search:*");
  assert.equal(searchKeys.length, 1);
  ok("search term normalized for key and query");

  await mongoose.disconnect();
  redisClient.disconnect();
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FAIL", err.message);
    process.exit(1);
  });
