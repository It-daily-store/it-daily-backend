import mongoose from "mongoose";
import config from "../app/config";

// datasetId was stored but never read: Meta unified pixels and datasets, so the
// dataset ID is the pixel ID. This clears the dead key left in existing configs.
const APPLY = process.argv.includes("--apply");

const main = async () => {
  await mongoose.connect(config.database_url as string);

  const dbName = mongoose.connection.name;
  const configs = mongoose.connection.db!.collection("metapixelconfigs");
  const stale = await configs.find({ datasetId: { $exists: true } }).toArray();

  console.log(`database: ${dbName}`);
  console.log(`configs carrying datasetId: ${stale.length}`);

  stale.forEach((doc) => {
    console.log(`  ${doc._id}: datasetId=${JSON.stringify(doc.datasetId)}`);
  });

  if (!stale.length) {
    console.log("\nNothing to do.");
    await mongoose.disconnect();
    return;
  }

  if (!APPLY) {
    console.log("\nDRY RUN — pass --apply to write");
    await mongoose.disconnect();
    return;
  }

  const result = await configs.updateMany(
    { datasetId: { $exists: true } },
    { $unset: { datasetId: "" } },
  );

  console.log(`\nunset on ${result.modifiedCount} document(s)`);

  const remaining = await configs.countDocuments({
    datasetId: { $exists: true },
  });

  console.log(`remaining with datasetId: ${remaining}`);

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(String(error));
  await mongoose.disconnect();
  process.exit(1);
});
