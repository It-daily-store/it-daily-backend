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

const MODULE_SET = new Set<string>(Object.values(EAppModules));

export type TUnrecognizedFeature = { feature: string; droppedCount: number };

// An entry whose (post-alias) feature matches no catalog module contributes
// nothing to `mapLegacyEntries` — its grant is silently dropped to all-false.
// Surfacing that here is what makes the dry run trustworthy for a typo nobody
// has found yet, the way `porductFilter` was for the one that was found.
export const findUnrecognizedFeatures = (
  entries: TLegacyEntry[],
): TUnrecognizedFeature[] =>
  entries
    .filter((e) => e.feature && !MODULE_SET.has(normaliseFeature(e.feature)!))
    .map((e) => ({
      feature: e.feature as string,
      droppedCount: Object.values(e.access ?? {}).filter(Boolean).length,
    }));

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
  let wouldMigrate = 0;
  let skipped = 0;
  let noPermissionsData = 0;

  for (const role of roles) {
    const entries: TLegacyEntry[] = role.permissions ?? [];

    if (entries.length === 0) {
      console.log(`SKIP  ${role.role} — no permissions data`);
      noPermissionsData += 1;
      continue;
    }

    if (isAlreadyMigrated(entries)) {
      console.log(`SKIP  ${role.role} — already migrated`);
      skipped += 1;
      continue;
    }

    for (const unrecognized of findUnrecognizedFeatures(entries)) {
      console.log(
        `  UNRECOGNIZED feature "${unrecognized.feature}" on role ${role.role} — ${unrecognized.droppedCount} set flag(s) will be DROPPED`,
      );
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
    } else {
      wouldMigrate += 1;
    }
  }

  console.log(
    `\n${
      APPLY
        ? `Applied. migrated=${migrated} skipped=${skipped} noPermissionsData=${noPermissionsData}`
        : `DRY RUN — nothing written. wouldMigrate=${wouldMigrate} skipped=${skipped} noPermissionsData=${noPermissionsData}`
    }`,
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
