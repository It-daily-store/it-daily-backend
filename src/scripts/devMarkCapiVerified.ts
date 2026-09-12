import mongoose from "mongoose";
import config from "../app/config";

// Test fixture only. Verifying the token for real requires live Meta credentials,
// so this stands in for a successful test connection when exercising the admin UI
// paths that are gated behind capiEnabled.
const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");

const main = async () => {
  await mongoose.connect(config.database_url as string);

  const dbName = mongoose.connection.name;

  if (!dbName.endsWith("_dev")) {
    throw new Error(
      `refusing to run against "${dbName}" — this fixture is for *_dev databases only`,
    );
  }

  const configs = mongoose.connection.db!.collection("metapixelconfigs");
  const doc = await configs.findOne({});

  if (!doc) throw new Error("no metapixelconfigs document found");

  const update = REVERT
    ? { $set: { capiEnabled: false }, $unset: { tokenVerifiedAt: "" } }
    : { $set: { capiEnabled: true, tokenVerifiedAt: new Date() } };

  console.log(`database: ${dbName}`);
  console.log(`action: ${REVERT ? "REVERT" : "mark verified"}`);
  console.log(
    `before: capiEnabled=${doc.capiEnabled} tokenVerifiedAt=${doc.tokenVerifiedAt ?? "unset"}`,
  );

  if (!APPLY) {
    console.log("\nDRY RUN — pass --apply to write");
    await mongoose.disconnect();
    return;
  }

  await configs.updateOne({ _id: doc._id }, update);
  const after = await configs.findOne({ _id: doc._id });
  console.log(
    `after:  capiEnabled=${after?.capiEnabled} tokenVerifiedAt=${after?.tokenVerifiedAt ?? "unset"}`,
  );

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(String(error));
  await mongoose.disconnect();
  process.exit(1);
});
