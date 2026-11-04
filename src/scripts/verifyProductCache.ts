import assert from "node:assert/strict";

const down = process.argv.includes("--down");

// Set before any import reads them; dotenv never overrides existing keys.
process.env.REDIS_URL = down
  ? "redis://127.0.0.1:6399"
  : process.env.TEST_REDIS_URL || "redis://127.0.0.1:6390";
process.env.CLIENT_URL = "http://127.0.0.1:6499";
process.env.REVALIDATE_SECRET = "test-secret";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const run = async () => {
  const { createServer } = await import("node:http");
  let revalidatePosts = 0;
  const storefront = createServer((req, res) => {
    if (req.headers["x-revalidate-secret"] === "test-secret") revalidatePosts++;
    res.end("{}");
  }).listen(6499);

  const { default: redisClient } = await import("../redis");
  const { cached, invalidateProductCache, buildParamKey } = await import(
    "../app/utils/productCache"
  );

  const ok = (name: string) => console.log(`OK  ${name}`);

  if (down) {
    const started = Date.now();
    const value = await cached("down", { a: 1 }, 60, async () => "from-db");
    assert.equal(value, "from-db");
    assert.ok(Date.now() - started < 1000, "took too long with Redis down");
    invalidateProductCache();
    ok("redis down");
    redisClient.disconnect();
    return;
  }

  await sleep(300);
  await redisClient.flushdb();

  assert.equal(
    buildParamKey({ b: "2", a: "x", c: "" }),
    buildParamKey({ a: "x", b: "2" }),
  );
  assert.notEqual(buildParamKey({ a: "Slug" }), buildParamKey({ a: "slug" }));
  ok("key normalization");

  let calls = 0;
  const loader = async () => {
    calls++;
    return { calls };
  };
  await cached("t", {}, 60, loader);
  const second = await cached("t", {}, 60, loader);
  assert.equal(calls, 1);
  assert.deepEqual(second, { calls: 1 });
  ok("miss then hit");

  invalidateProductCache();
  await sleep(200);
  await cached("t", {}, 60, loader);
  assert.equal(calls, 2);
  ok("invalidate");

  let release: (v: string) => void = () => {};
  const slow = cached(
    "race",
    {},
    60,
    () => new Promise<string>((resolve) => (release = resolve)),
  );
  await sleep(100);
  invalidateProductCache();
  await sleep(200);
  release("old");
  assert.equal(await slow, "old");
  await sleep(100);
  assert.equal(await cached("race", {}, 60, async () => "new"), "new");
  ok("stale set lands under old version");

  const ttl = await redisClient.ttl(
    (await redisClient.keys("cache:products:v*:t:*"))[0],
  );
  assert.ok(ttl >= 54 && ttl <= 66, `ttl ${ttl} outside 60±10%`);
  ok("ttl jitter range");

  await sleep(2000);
  revalidatePosts = 0;
  invalidateProductCache();
  await sleep(3000);
  assert.equal(revalidatePosts, 2, `expected 2 revalidate calls, got ${revalidatePosts}`);
  ok("storefront revalidated twice to cover in-flight renders");

  storefront.close();
  redisClient.disconnect();
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FAIL", err);
    process.exit(1);
  });
