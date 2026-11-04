# Product Caching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the whole-catalog Redis blobs with versioned per-key cache-aside for storefront product reads, invalidated on every product-affecting write, including the Next.js storefront cache.

**Architecture:** One Redis counter `cache:products:ver` is embedded in every cached key; writes `INCR` it after the DB write and POST to the storefront's `/api/revalidate`, which calls `revalidateTag('products')`. Admin and deal reads go straight to MongoDB; the product/deal blob queues and workers are deleted.

**Tech Stack:** Express, Mongoose, ioredis (fail-fast client in `src/redis.ts`), Next.js 15.4 App Router.

**Spec:** `docs/superpowers/specs/2026-11-04-product-caching-design.md`

## Global Constraints

- Key format: `cache:products:v{ver}:{endpoint}:{params}`; version key `cache:products:ver`; missing version = `0`, never created on read.
- TTLs: product detail 300 s, category filters 300 s, all other cached lists/search 60 s; ±10% random jitter.
- Write path never writes cache values; it only `INCR`s the version, after the DB write succeeds.
- Cache/Redis/revalidate failures never fail or delay a request beyond Redis's `commandTimeout`; the revalidate POST is fire-and-forget with a 3 s timeout.
- Bulk uploads and order placement invalidate once, not per record.
- Next.js tag name: `products`. Secret header: `x-revalidate-secret`. Env var: `REVALIDATE_SECRET` in both repos; backend posts to `${CLIENT_URL}/api/revalidate`.
- No test framework exists: verification is `npx tsc --noEmit -p .` plus a `ts-node` verification script.
- Do not commit; the owner commits. Minimal one-line comments only where needed.

## Review Focus

- Redis unreachable or over quota: every storefront endpoint still returns correct data from MongoDB (Task 1 script case "redis down").
- A slow reader that loaded data before a write must not repopulate the current version (Task 1 script case "stale set lands under old version").
- Same query with different param order/casing/whitespace hits the same key (Task 1 script case "key normalization").
- Admin product list with `category` / `createdBy` / `sort` filters returns filtered results (Task 3 manual check, previously broken by the blob path).
- Revalidate endpoint with a missing/wrong secret returns 401 and does not revalidate (Task 4 manual curl).

---

### Task 1: Cache helper

**Files:**
- Create: `src/app/utils/productCache.ts`
- Create: `src/scripts/verifyProductCache.ts`
- Modify: `src/app/config/index.ts` (add `revalidate_secret: process.env.REVALIDATE_SECRET`)
- Modify: `package.json` scripts (`"verify:product-cache": "ts-node src/scripts/verifyProductCache.ts"`)
- Modify: `.env`, `.env.prod` (add `REVALIDATE_SECRET=` placeholder line; owner fills value)

**Interfaces:**
- Produces:
  - `cached<T>(endpoint: string, params: Record<string, unknown>, ttlSeconds: number, loader: () => Promise<T>): Promise<T>`
  - `invalidateProductCache(): void` (fire-and-forget: `INCR` + revalidate POST, both errors logged)
  - `buildParamKey(params: Record<string, unknown>): string` (exported for the script)
  - constants `PRODUCT_TTL = 300`, `LIST_TTL = 60`

- [ ] **Step 1:** Write `src/scripts/verifyProductCache.ts` that sets `REDIS_URL` to a local Redis (`redis://localhost:6379`), and asserts with `node:assert`:
  - "key normalization": `buildParamKey({ b: "2", a: " Laptop " , c: "" })` === `buildParamKey({ a: "laptop", b: "2" })`.
  - "miss then hit": loader counter is 1 after two `cached("t", {}, 60, loader)` calls.
  - "invalidate": after `invalidateProductCache()` and a 200 ms wait, the next `cached` call runs the loader again.
  - "stale set lands under old version": start `cached` with a loader that awaits a promise; call `invalidateProductCache()` while it is pending; resolve the loader with `"old"`; the next `cached` call with loader returning `"new"` returns `"new"`.
  - "redis down": with a second import pointed at `redis://127.0.0.1:6399` (run as a separate child process or a flag `--down`), `cached` returns the loader value and finishes in < 1000 ms.
- [ ] **Step 2:** Run `npm run verify:product-cache` → fails (module missing).
- [ ] **Step 3:** Implement `productCache.ts` using `redisClient` / `getCache` from `src/redis.ts`. `cached`: read version (on error → return `loader()` without caching), build key, `getCache`, on hit `JSON.parse`, on miss run loader then `setex` with jittered TTL (errors logged). `buildParamKey`: drop empty/undefined values, trim + lowercase strings, sort keys, `JSON.stringify`; if longer than 200 chars use SHA-1 hex (`node:crypto`). `invalidateProductCache`: `redisClient.incr(VERSION_KEY).catch(log)`; if `config.client_url` and `config.revalidate_secret` are set, `fetch(`${client_url}/api/revalidate`, { method: "POST", headers: { "x-revalidate-secret": secret }, signal: AbortSignal.timeout(3000) }).catch(log)`.
- [ ] **Step 4:** Run `npm run verify:product-cache` → all cases print OK; `npx tsc --noEmit -p .` → no errors.

### Task 2: Cache storefront reads

**Files:**
- Modify: `src/app/modules/product/product.service.ts` — `getSingleProductBySlugFromDB` (`:252`), `getFeaturedProductFromDB` (`:967`), `getNewArrivalsFromDB` (`:981`), `getBestSellersFromDB` (`:993`), `getProductsByBrandFromDB` (`:1006`), `getProductByCategoryFromDB` (`:1043`), `getFiltersByCategoryFromDB` (`:1089`), `getSearchProductsFromDB` (`:1125`)

**Interfaces:**
- Consumes: `cached`, `PRODUCT_TTL`, `LIST_TTL` from Task 1.

- [ ] **Step 1:** Wrap each function body in `cached(<endpoint>, <all inputs>, <ttl>, async () => { ...existing body... })`. Endpoints: `slug`, `featured`, `newArrivals`, `bestSellers`, `brand`, `category`, `filters`, `search`. TTL `PRODUCT_TTL` for `slug` and `filters`, `LIST_TTL` otherwise. Params include every argument the function reads (e.g. `{ slug, ...query }`, `{ limit: queryLimit }`). Validation that throws `AppError` stays outside `cached` so errors are not cached.
- [ ] **Step 2:** In `getSearchProductsFromDB` remove the `getProductsFromRedis`/`sift` branch; always use the `Product.find(filters)…limit(15)` query.
- [ ] **Step 3:** Ensure loaders return plain objects (`.lean()` or `JSON.parse(JSON.stringify(x))`) so hit and miss responses are identical.
- [ ] **Step 4:** `npx tsc --noEmit -p .` → no errors. Run the dev server against local Redis, `curl` `/api/v1/customer/product/get-single/<real-slug>` twice; `redis-cli keys "cache:products:*"` shows one `slug` key; responses are byte-identical.

### Task 3: Invalidate on writes; remove blob caches

**Files:**
- Modify: `src/app/modules/product/product.service.ts` — after `Product.create` (`:81`), after the bulk loops (`:605`, `:834` replace `refreshProductsCache()`), after update (`:946` replace `refreshSingleProductCache`); remove the Redis branch of `getAllProductsFromDB` (`:131-221`) and the `refreshProductsCache()` at `:183`; remove imports of `getProductsFromRedis`, `sift` (if unused), queue helpers.
- Modify: `src/app/modules/order/order.service.ts` — one `invalidateProductCache()` after the stock loop (`:289-293`).
- Modify: `src/app/modules/brand/brand.service.ts` — create/update/delete.
- Modify: `src/app/modules/category/category.service.ts` — create/update/delete.
- Modify: `src/app/modules/productFilters/filter.service.ts` — create/delete (and update if present).
- Modify: `src/app/modules/deals/deals.service.ts` — replace `getCache(...)` reads at `:78`, `:147`, `:298` with their MongoDB branches; delete `refreshDealsCache()`/`refreshProductsCache()`/`setProductsToRedis()` calls.
- Modify: `src/server.ts` — remove startup refresh calls and imports.
- Delete: `src/app/modules/product/product.queue.ts`, `src/app/modules/product/product.redis.ts`, `src/app/modules/deals/deal.queue.ts`, `src/app/modules/deals/deal.redis.ts`.
- Modify: `src/app/interface/common.ts` — remove `RedisKeys.products`, `RedisKeys.deals`.

**Interfaces:**
- Consumes: `invalidateProductCache()` from Task 1.

- [ ] **Step 1:** Make the edits above. Before deleting files, `grep -rn` each export to confirm no remaining importers. Also grep for any other `Product`/`Brand`/`Category`/`ProductFilter` writes (`updateMany`, `bulkWrite`, `.save()`, `$inc`) and add `invalidateProductCache()` there.
- [ ] **Step 2:** `npx tsc --noEmit -p .` → no errors; `grep -rn "RedisKeys.products\|RedisKeys.deals\|refreshProductsCache\|refreshDealsCache\|getProductsFromRedis" src` → no matches.
- [ ] **Step 3:** With dev server + local Redis: GET a product by slug (cache filled), PATCH that product's price via the admin update route, GET again → new price; `redis-cli get cache:products:ver` incremented by 1. Admin `GET /api/v1/product/get-all?category=<id>` returns only that category.

### Task 4: Storefront on-demand revalidation (`it-daily-homepage`)

**Files:**
- Create: `src/app/api/revalidate/route.ts`
- Modify (add `tags: ['products']` inside the existing `next: {}` option, or add `next: { tags: ['products'] }` where absent): `src/app/brand/[brandId]/page.tsx`, `src/app/pc-builder/[id]/page.tsx`, `src/components/category/CategoryPageTopSection.tsx`, `src/components/category/CategoryProducts.tsx`, `src/components/category/FiltersSidebar.tsx`, `src/components/homepage/BestSellers.tsx`, `src/components/homepage/FeaturedProducts.tsx`, `src/components/homepage/NewArrivals.tsx`, `src/components/homepage/ShopByBrand.tsx`, `src/components/product/details/fetchProductDetails.ts`, `src/components/shared/Navbar/MobileCategoryMenu.tsx`
- Modify: homepage `.env`, `.env.prod` (add `REVALIDATE_SECRET=` placeholder)

**Interfaces:**
- Produces: `POST /api/revalidate` — header `x-revalidate-secret`; 401 `{ ok: false }` on missing/mismatch or unset env; 200 `{ ok: true }` after `revalidateTag('products')`.

- [ ] **Step 1:** Implement the route handler (`export async function POST(req: Request)`), comparing with `crypto.timingSafeEqual` on equal-length buffers.
- [ ] **Step 2:** Add tags to every fetch listed.
- [ ] **Step 3:** `npx tsc --noEmit` and `npm run lint` in the homepage repo → no new errors. With the homepage dev server: `curl -X POST localhost:<port>/api/revalidate` → 401; with the correct header → 200 `{ ok: true }`.
- [ ] **Step 4:** End-to-end (both servers local, matching `REVALIDATE_SECRET`, backend `CLIENT_URL` pointing at the local homepage): load a product page, change its price in admin, reload → new price.
