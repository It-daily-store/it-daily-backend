import assert from "node:assert/strict";

process.env.REDIS_URL = "redis://127.0.0.1:6399";

const run = async () => {
  const { toSlug, isValidSlug } = await import("../app/utils/slug");
  const { CategoryValidations } = await import(
    "../app/modules/category/category.validation"
  );
  const { ProductServices } = await import(
    "../app/modules/product/product.service"
  );
  const ok = (name: string) => console.log(`OK  ${name}`);

  assert.equal(
    toSlug('Corsair XENEON 32" IPS (VQ1-00001) 15.6 + RGB'),
    "corsair-xeneon-32-ips-vq1-00001-156-rgb",
  );
  assert.ok(isValidSlug(toSlug('HP ProBook 15.6" FHD')));
  ok("generated slugs are clean");

  for (const bad of ['32"-ips', "a b", "a/b", "a--b", "-a", "a-", "a.b", "a+b", ""]) {
    assert.equal(isValidSlug(bad), false, `accepted ${JSON.stringify(bad)}`);
  }
  for (const good of ["laptop", "Tablet", "gaming-laptop-16"]) {
    assert.equal(isValidSlug(good), true, `rejected ${good}`);
  }
  ok("slug rule");

  const base = { name: "x", product_details_categories: [] };
  assert.equal(
    CategoryValidations.createCategoryValidationSchema.safeParse({ ...base, slug: 'tv-32"' }).success,
    false,
  );
  assert.equal(
    CategoryValidations.createCategoryValidationSchema.safeParse({ ...base, slug: "tv-32" }).success,
    true,
  );
  assert.equal(
    CategoryValidations.updateCategoryValidationSchema.safeParse({ ...base, slug: "a b" }).success,
    false,
  );
  ok("category create/update reject bad slugs");

  await assert.rejects(
    ProductServices.updateProductIntoDB(
      "000000000000000000000000",
      { slug: 'monitor-32"' },
      undefined as never,
    ),
    /Slug can only contain/,
  );
  ok("product update rejects bad slug");
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FAIL", err.message);
    process.exit(1);
  });
