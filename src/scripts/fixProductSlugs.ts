import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import config from "../app/config";
import { Product } from "../app/modules/product/product.model";
import { planSlugFixes } from "../app/utils/slug";
import { invalidateProductCache } from "../app/utils/productCache";

// Usage: npm run fix:product-slugs            (dry run)
//        npm run fix:product-slugs -- --apply (writes changes)
const apply = process.argv.includes("--apply");

const run = async () => {
  await mongoose.connect(config.database_url as string);
  console.log(`Database: ${mongoose.connection.name}`);

  const products = await Product.find().select("_id slug name").lean();
  const plan = planSlugFixes(products, new Set());

  if (plan.length === 0) {
    console.log("All product slugs are already valid.");
    return;
  }

  plan.forEach((fix) => console.log(`${fix.from}\n  -> ${fix.to}`));
  console.log(`\n${plan.length} of ${products.length} products need a new slug.`);

  if (!apply) {
    console.log("Dry run only. Re-run with --apply to update them.");
    return;
  }

  await Product.bulkWrite(
    plan.map((fix) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(fix.id) },
        update: { $set: { slug: fix.to } },
      },
    })),
  );

  const mappingFile = path.join(
    process.cwd(),
    `slug-changes-${mongoose.connection.name}-${Date.now()}.json`,
  );
  fs.writeFileSync(mappingFile, JSON.stringify(plan, null, 2));

  invalidateProductCache();
  // Give the fire-and-forget invalidation time to reach Redis and the storefront.
  await new Promise((r) => setTimeout(r, 3000));

  console.log(`Updated ${plan.length} slugs. Old -> new mapping: ${mappingFile}`);
};

run()
  .then(() => mongoose.disconnect())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Slug fix failed:", err);
    process.exit(1);
  });
