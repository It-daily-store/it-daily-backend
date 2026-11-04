import assert from "node:assert/strict";

process.env.REDIS_URL = "redis://127.0.0.1:6399";

const run = async () => {
  const { toSlug, isValidSlug, planSlugFixes } = await import("../app/utils/slug");
  const { CategoryValidations } = await import(
    "../app/modules/category/category.validation"
  );
  const { ProductServices } = await import(
    "../app/modules/product/product.service"
  );
  const ok = (name: string) => console.log(`OK  ${name}`);

  assert.equal(
    toSlug('Corsair XENEON 32" IPS (VQ1-00001) 15.6 + RGB'),
    "corsair-xeneon-32-inch-ips-vq1-00001-15-6-plus-rgb",
  );
  assert.equal(
    toSlug('Gigabyte A16 16" FHD+ Copilot+ PC 12.4"'),
    "gigabyte-a16-16-inch-fhd-plus-copilot-plus-pc-12-4-inch",
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

  const plan = planSlugFixes(
    [
      { _id: "1", slug: 'Monitor-32"-IPS', name: "Monitor 32 IPS" },
      { _id: "2", slug: 'Monitor-32-inch-IPS"', name: "Monitor 32 IPS" },
      { _id: "3", slug: "already-clean", name: "Clean" },
      { _id: "4", slug: '""', name: 'Odd "name"' },
      { _id: "5", slug: "taken-(x)", name: "Taken" },
    ],
    new Set(["taken-x"]),
  );
  assert.deepEqual(plan, [
    { id: "1", from: 'Monitor-32"-IPS', to: "monitor-32-inch-ips" },
    { id: "2", from: 'Monitor-32-inch-IPS"', to: "monitor-32-inch-ips-2" },
    { id: "4", from: '""', to: "odd-name" },
    { id: "5", from: "taken-(x)", to: "taken-x-2" },
  ]);
  plan.forEach((fix) => assert.ok(isValidSlug(fix.to)));
  ok("slug fix plan: clean, unique, skips valid ones");
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FAIL", err.message);
    process.exit(1);
  });
