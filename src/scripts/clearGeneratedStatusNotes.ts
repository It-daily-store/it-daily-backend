import mongoose from "mongoose";
import config from "../app/config";
import Order from "../app/modules/order/order.model";

/**
 * One-off cleanup. `statusHistory[].notes` used to hold a generated display
 * sentence; it now holds only a note an admin actually typed. This removes the
 * historical generated strings so they stop rendering as human notes.
 *
 *   npm run clean:status-notes           # dry run, reports only
 *   npm run clean:status-notes -- --apply
 */
const GENERATED_NOTE =
  /^(Order placed successfully|Order has been confirmed|Status (updated|changed) to \w+( by admin)?)$/;

const run = async () => {
  const apply = process.argv.includes("--apply");

  if (!config.database_url) {
    throw new Error("DATABASE_URL is not set");
  }

  await mongoose.connect(config.database_url);

  const orders = await Order.find({ "statusHistory.notes": { $exists: true } });

  let generated = 0;
  let kept = 0;
  let touchedOrders = 0;

  for (const order of orders) {
    let changed = false;

    for (const entry of order.statusHistory) {
      if (!entry.notes) continue;

      if (GENERATED_NOTE.test(entry.notes.trim())) {
        generated++;
        entry.notes = undefined;
        changed = true;
      } else {
        kept++;
      }
    }

    if (changed) {
      touchedOrders++;
      if (apply) await order.save();
    }
  }

  console.log(`orders scanned:        ${orders.length}`);
  console.log(`orders affected:       ${touchedOrders}`);
  console.log(`generated notes found: ${generated}`);
  console.log(`human notes preserved: ${kept}`);
  console.log(
    apply ? "APPLIED — generated notes removed." : "DRY RUN — nothing written. Re-run with --apply."
  );

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
