# Product caching redesign

Date: 2026-11-04
Repos: `it-daily-backend` (main work), `it-daily-homepage` (on-demand revalidation)

## Why

The backend caches the entire product catalog as one Redis value (`products`), and all deals as another (`deals`). Every read of the cache downloads the whole blob and filters it in Node with `sift`; every write rebuilds the whole blob through a BullMQ job. On Upstash, which bills per command and caps monthly requests, this burns quota (blob reads, blob rewrites, and two always-polling workers) and storage grows with the catalog. The owner expects ~1000+ products and wants the industry-standard approach instead: small per-key entries with short TTLs, and **correct invalidation** so customers never see stale prices or stock for longer than necessary.

Today the blob is only read in three places: the admin product list, storefront search, and deal product validation. The admin list's cached branch is also buggy (it ignores `category`, `createdBy` and `sort`, so results differ depending on whether the cache is warm).

The storefront (Next.js 15.4) additionally caches every product fetch with `force-cache` + `revalidate` 60–600 s and no tags, so even perfect Redis invalidation would leave customers seeing stale data for up to 10 minutes.

## Goals

- Replace whole-catalog caching with per-key cache-aside entries for storefront product reads.
- Invalidation that is correct under concurrency: after a product-affecting write commits, no reader is served data older than that write (beyond the in-flight request itself).
- The storefront's Next.js cache is invalidated on the same writes, so customers see changes on their next page load.
- Bounded Redis storage that does not grow with traffic patterns (everything has a TTL).
- Fewer Upstash requests than today.

## Non-goals

- Caching admin endpoints. Admin traffic is low and admins need to see their edit immediately; admin reads go straight to MongoDB.
- Caching cart, checkout, orders, auth, or anything user-specific.
- A search engine (Meilisearch/Atlas Search). MongoDB queries are fine at this catalog size.
- Per-product fine-grained invalidation. One coarse counter is deliberately chosen (see below).

## Anti-goals (failure even if it "works")

- A price or stock change that a customer can still see after the admin's save returned, other than through a TTL backstop when Redis or the revalidate call failed.
- Any request that hangs or errors because Redis is down or out of quota. Cache failure must only cost latency.
- Reintroducing a background worker that polls Redis for cache rebuilds.

## Design

### 1. One version counter for all product-derived data

Redis key `cache:products:ver` holds an integer. Every cached storefront response key embeds the current value:

```
cache:products:v{ver}:{endpoint}:{params}
```

- **Read path (cache-aside):** read `ver` → read the data key → on hit return it; on miss query MongoDB, `SETEX` the result under the key built from the `ver` read *before* the query, return it.
- **Write path:** after the MongoDB write succeeds, `INCR cache:products:ver`, then trigger storefront revalidation (section 4). Never write or overwrite cache values on the write path.
- **Why this is race-safe:** a reader that loaded old data before the `INCR` stores it under the old version, which no later reader looks up. This removes the "set-after-delete" race without double-deletes or locks. Old-version keys are never deleted explicitly; they expire by TTL.
- **Why one counter:** any of these writes can change what several endpoints return (a stock change shows on the product page, category list, and homepage sections; a brand rename shows inside product responses). A single counter cannot miss a dependency. The cost is that any write invalidates every product cache entry; at this catalog size and write rate that is acceptable.
- If `ver` does not exist yet, treat it as `0` (do not create it on read).

### 2. What gets cached (storefront only)

| Endpoint (under `/customer`) | Service function | TTL |
|---|---|---|
| `product/get-single/:slug` | `getSingleProductBySlugFromDB` | 300 s |
| `product/by-category/...` (category products) | `getProductByCategoryFromDB` | 60 s |
| category filters | `getFiltersByCategoryFromDB` | 300 s |
| `product/search` | `getSearchProductsFromDB` | 60 s |
| `product/by-brand/:brandId` | `getProductsByBrandFromDB` | 60 s |
| `product/get-featured`, `new-arrivals`, `best-sellers` | respective functions | 60 s |

TTLs get ±10% random jitter so entries do not expire together. TTL is only a backstop; freshness comes from the version counter.

Not cached (left as-is): `pc-builder/:id`, `compare`, `static-slugs`, sitemap, all admin routes.

**Key params** are normalized so equivalent requests share a key: sort query keys alphabetically, trim and lowercase the search term, drop empty values, and include page/limit/sort/filter. If the param string is longer than ~200 chars, use a SHA-1 hash of it.

Cache the service function's return value (the JSON the controller sends), not Mongoose documents.

### 3. Writes that must invalidate

Every one of these must call the shared `invalidateProductCache()` once, after the DB write succeeds:

- Product: create (`product.service.ts:81`), update (`:944`), bulk CSV upload (`:538` loop) and bulk JSON upload (`:772` loop). **Bulk uploads invalidate once at the end, not per record.**
- Product delete, if/where it exists.
- Order placement stock decrement (`order.service.ts:290`), once after the loop. Also any place stock is restored (e.g. cancellation), if present.
- Brand create/update/delete (`brand.service.ts`).
- Category create/update/delete (`category.service.ts`).
- Product filter create/update/delete (`productFilters` module), since category filter responses include them.
- Deal writes only if a cached storefront response includes deal data; the builder must verify. Today no storefront route returns deals.

The builder should grep for any other `Product`/`Brand`/`Category`/`ProductFilter` writes (`updateMany`, `bulkWrite`, `.save()`, `$inc`) and include them.

### 4. Storefront (Next.js) on-demand revalidation

- Add `next: { tags: ['products'] }` to every product-derived `fetch` in `it-daily-homepage` (homepage sections, product details, category products/filters/top section, brand page, pc-builder product list). Keep the existing `revalidate` values as a backstop.
- Add `src/app/api/revalidate/route.ts` (POST). It checks a shared secret header (`x-revalidate-secret` against `REVALIDATE_SECRET`), rejects anything else with 401, and calls `revalidateTag('products')`.
- Backend `invalidateProductCache()` POSTs to `${CLIENT_URL}/api/revalidate` with the secret, fire-and-forget with a ~3 s timeout. Failure is logged and never fails the admin's request. *(Designer's call: not awaited, because order placement also invalidates and checkout must not wait on the storefront. The resulting window is the round-trip time of one HTTP call.)*
- The storefront is hosted on Render as a single instance (confirmed by the owner), so one `revalidateTag` call clears every cache. Running several self-hosted containers would need a shared Next.js `cacheHandler` or a fan-out of the call; that is out of scope.
- New env vars: `REVALIDATE_SECRET` in both repos (`.env` and `.env.prod`); the backend reuses existing `CLIENT_URL`.

### 5. Removals

- `products` and `deals` blob caches: `product.redis.ts`, `deal.redis.ts`, their BullMQ queues and workers (`product.queue.ts`, `deal.queue.ts`), the startup refresh in `server.ts`, `RedisKeys.products`/`RedisKeys.deals`, and the `refreshProductsCache`/`refreshSingleProductCache`/`refreshDealsCache` call sites.
- Admin product list (`getAllProductsFromDB`) uses only its MongoDB branch.
- Deals service reads (`deals.service.ts` lines ~78, ~147, ~298) query MongoDB directly (the existing fallback branches).
- The email and metaPixel queues stay.

### 6. Failure behaviour

Use the existing fail-fast client in `src/redis.ts` (offline queue disabled, `commandTimeout`).

- `ver` read fails → skip the cache entirely for this request: query MongoDB, do not write to Redis.
- Data read or `SETEX` fails → log and continue with the MongoDB result.
- `INCR` fails → log; staleness is bounded by TTL (max 300 s) and the Next.js revalidate call still runs.
- Cache errors are never surfaced to the client.

### 7. Redis cost (expected)

Cached read: 2 commands on hit (`GET ver`, `GET data`), 3 on miss (+`SETEX`). Write: 1 (`INCR`). With the two blob workers removed, idle polling roughly halves. Storage is bounded by the number of distinct pages viewed within one TTL window.

## Constraints

- No test framework exists in the backend; verify with targeted scripts or manual runs (e.g. `ts-node` script against a local Redis and an unreachable Redis), plus `tsc --noEmit`.
- Match existing code style; minimal one-line comments only where code can't explain itself.
- Local dev must not use the production Upstash database for testing this.

## Left to the builder

- File layout of the cache helper (suggested: `src/app/utils/productCache.ts` exporting `cached(endpoint, params, ttl, loader)` and `invalidateProductCache()`).
- Exact key-normalization implementation.
- Whether to read `ver` and data in one round trip (e.g. a tiny Lua script) instead of two GETs; optional optimization.
