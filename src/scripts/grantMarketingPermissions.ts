import mongoose from "mongoose";
import config from "../app/config";
import {
  EAppModules,
  TModulePermission,
} from "../app/modules/roles/roles.interface";
import { PERMISSION_CATALOG } from "../app/modules/roles/roles.permissions";

const APPLY = process.argv.includes("--apply");

// Roles that already administer site-wide settings are the ones expected to own
// tracking configuration; narrower roles must be granted marketing by hand.
const BELLWETHER_KEY = "can_update_settings";

const MARKETING_KEYS = PERMISSION_CATALOG[EAppModules.marketing].map(
  (definition) => definition.key,
);

const buildMarketingEntry = (granted: boolean): TModulePermission => ({
  module: EAppModules.marketing,
  permissions: Object.fromEntries(
    MARKETING_KEYS.map((key) => [key, granted]),
  ) as TModulePermission["permissions"],
});

const hasSettingsAdmin = (permissions: TModulePermission[]) =>
  permissions.some(
    (entry) =>
      entry.module === EAppModules.settings &&
      entry.permissions?.[BELLWETHER_KEY] === true,
  );

const main = async () => {
  await mongoose.connect(config.database_url as string);

  const dbName = mongoose.connection.name;
  const roles = mongoose.connection.db!.collection("roles");
  const docs = await roles.find({}).toArray();

  const planned: string[] = [];
  const skipped: string[] = [];

  for (const doc of docs) {
    const permissions = (doc.permissions ?? []) as TModulePermission[];
    const existing = permissions.find(
      (entry) => entry.module === EAppModules.marketing,
    );

    if (existing) {
      const missing = MARKETING_KEYS.filter(
        (key) => existing.permissions?.[key] === undefined,
      );

      if (!missing.length) {
        skipped.push(`${doc.role}: already has all ${MARKETING_KEYS.length}`);
        continue;
      }

      // A partial entry predates a catalog addition; fill the gaps as denied
      // rather than granting, so a deliberate revoke is never undone.
      if (APPLY) {
        missing.forEach((key) => {
          existing.permissions[key] = false;
        });
        await roles.updateOne({ _id: doc._id }, { $set: { permissions } });
      }
      planned.push(`${doc.role}: backfill ${missing.length} key(s) as denied`);
      continue;
    }

    const granted = hasSettingsAdmin(permissions);

    if (APPLY) {
      await roles.updateOne(
        { _id: doc._id },
        { $set: { permissions: [...permissions, buildMarketingEntry(granted)] } },
      );
    }
    planned.push(
      `${doc.role}: add marketing (${granted ? "granted" : "denied"})`,
    );
  }

  console.log(`database: ${dbName}`);
  console.log(`mode: ${APPLY ? "APPLY" : "DRY RUN (pass --apply to write)"}`);
  console.log(`\nchanges (${planned.length}):`);
  planned.forEach((line) => console.log(`  ${line}`));
  console.log(`\nunchanged (${skipped.length}):`);
  skipped.forEach((line) => console.log(`  ${line}`));

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
