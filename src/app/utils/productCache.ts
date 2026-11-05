import { createHash } from "node:crypto";
import redisClient, { getCache } from "../../redis";
import { revalidateStorefront } from "./storefront";

const VERSION_KEY = "cache:products:ver";

export const PRODUCT_TTL = 300;
export const LIST_TTL = 60;

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

const jitter = (ttl: number) =>
  Math.round(ttl * (0.9 + Math.random() * 0.2));

// Values are kept verbatim: slugs and ids are case-sensitive, so callers normalize what is safe to.
export const buildParamKey = (params: Record<string, unknown>) => {
  const entries = Object.keys(params)
    .filter((key) => {
      const value = params[key];
      return value !== undefined && value !== null && value !== "";
    })
    .sort()
    .map((key) => [key, params[key]]);

  const key = JSON.stringify(entries);

  return key.length > 200 ? createHash("sha1").update(key).digest("hex") : key;
};

const getVersion = async () => {
  try {
    return (await redisClient.get(VERSION_KEY)) ?? "0";
  } catch (err) {
    console.error(`Product cache version read failed: ${errorMessage(err)}`);
    return null;
  }
};

export const cached = async <T>(
  endpoint: string,
  params: Record<string, unknown>,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> => {
  // Version is read before the DB query so a slow, stale load is stored under an old version.
  const version = await getVersion();

  if (version === null) {
    return loader();
  }

  const key = `cache:products:v${version}:${endpoint}:${buildParamKey(params)}`;

  const hit = await getCache(key);

  if (hit !== null) {
    try {
      return JSON.parse(hit) as T;
    } catch {
      // Corrupt entry: fall through and overwrite it.
    }
  }

  const result = await loader();

  try {
    await redisClient.setex(key, jitter(ttlSeconds), JSON.stringify(result));
  } catch (err) {
    console.error(`Product cache write failed for ${key}: ${errorMessage(err)}`);
  }

  return result;
};

export const invalidateProductCache = () => {
  redisClient
    .incr(VERSION_KEY)
    .catch((err) =>
      console.error(`Product cache invalidation failed: ${errorMessage(err)}`),
    );

  revalidateStorefront(["products"]);
};
