import config from "../config";

export type TStorefrontTag = "products" | "banner";

const RETRY_DELAY = 1500;

const post = (tags: TStorefrontTag[]) => {
  if (!config.client_url || !config.revalidate_secret) {
    return;
  }

  fetch(`${config.client_url}/api/revalidate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-revalidate-secret": config.revalidate_secret,
    },
    body: JSON.stringify({ tags }),
    signal: AbortSignal.timeout(3000),
  })
    .then((res) => {
      if (!res.ok) {
        console.error(`Storefront revalidation returned ${res.status}`);
      }
    })
    .catch((err) =>
      console.error(
        `Storefront revalidation failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      ),
    );
};

// Fire-and-forget; never blocks or fails the request that changed the data.
export const revalidateStorefront = (tags: TStorefrontTag[]) => {
  post(tags);
  // A storefront render that fetched before the write can finish after the first revalidation and re-store old data.
  setTimeout(() => post(tags), RETRY_DELAY).unref();
};
