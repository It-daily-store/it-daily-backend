import mongoose from "mongoose";
import config from "../app/config";
import {
  EAppModules,
  TModulePermission,
} from "../app/modules/roles/roles.interface";
import { PERMISSION_CATALOG } from "../app/modules/roles/roles.permissions";

type TLegacyAccess = Partial<
  Record<"read" | "create" | "update" | "delete", boolean>
>;
type TLegacyEntry = { feature?: string; access?: TLegacyAccess };

const APPLY = process.argv.includes("--apply");

// Roles created through an older admin build persisted this misspelling of
// `productFilter`. Left unmapped, those roles silently lose all product-filter
// access on migration, because no catalog module matches the stored value.
const LEGACY_FEATURE_ALIASES: Record<string, string> = {
  porductFilter: "productFilter",
};

const normaliseFeature = (feature?: string) =>
  feature ? (LEGACY_FEATURE_ALIASES[feature] ?? feature) : feature;

export const mapLegacyEntries = (
  entries: TLegacyEntry[],
): TModulePermission[] =>
  Object.values(EAppModules).map((module) => {
    const legacy = entries.find(
      (e) => normaliseFeature(e.feature) === module,
    );
    const permissions = Object.fromEntries(
      PERMISSION_CATALOG[module].map((def) => [
        def.key,
        legacy?.access?.[def.legacy] === true,
      ]),
    );
    return { module, permissions };
  });

export const isAlreadyMigrated = (entries: TLegacyEntry[]) =>
  entries.every((e) => !e.feature);

const migrate = async () => {
  if (!config.database_url) {
    throw new Error("DATABASE_URL is not set");
  }

  await mongoose.connect(config.database_url);
  const collection = mongoose.connection.collection("roles");

  const roles = await collection.find({}).toArray();
  console.log(`Found ${roles.length} role document(s).\n`);

  let migrated = 0;
  let skipped = 0;

  for (const role of roles) {
    const entries: TLegacyEntry[] = role.permissions ?? [];

    if (isAlreadyMigrated(entries)) {
      console.log(`SKIP  ${role.role} — already migrated`);
      skipped += 1;
      continue;
    }

    const next = mapLegacyEntries(entries);

    const grantedCount = next.reduce(
      (sum, e) => sum + Object.values(e.permissions).filter(Boolean).length,
      0,
    );
    const legacyCount = entries.reduce(
      (sum, e) => sum + Object.values(e.access ?? {}).filter(Boolean).length,
      0,
    );
    console.log(
      `MIGRATE ${role.role} — ${legacyCount} legacy flag(s) -> ${grantedCount} granted key(s)`,
    );

    if (APPLY) {
      await collection.updateOne(
        { _id: role._id },
        { $set: { permissions: next } },
      );
      migrated += 1;
    }
  }

  console.log(
    `\n${APPLY ? "Applied" : "DRY RUN — nothing written"}. migrated=${migrated} skipped=${skipped}`,
  );
  console.log(APPLY ? "" : "Re-run with --apply to write.");

  await mongoose.disconnect();
};

if (require.main === module) {
  migrate().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
