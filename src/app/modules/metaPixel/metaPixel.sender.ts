import axios from "axios";
import { GRAPH_API_VERSION } from "./metaPixel.constants";
import { TCapiPayload } from "./metaPixel.payload";

export type TSendResult = {
  ok: boolean;
  httpStatus?: number;
  body?: Record<string, unknown>;
  fbtraceId?: string;
  retryable: boolean;
  errorMessage?: string;
};

export const sendToMeta = async (args: {
  pixelId: string;
  accessToken: string;
  payload: TCapiPayload;
}): Promise<TSendResult> => {
  const { pixelId, accessToken, payload } = args;

  try {
    const res = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events`,
      { ...payload, access_token: accessToken },
      { timeout: 15000 },
    );

    return {
      ok: true,
      httpStatus: res.status,
      body: res.data,
      fbtraceId: res.data?.fbtrace_id,
      retryable: false,
    };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const body = err.response?.data;

      // 4xx other than 429 means the request itself is wrong — a retry sends
      // the identical bad request, so treat it as terminal.
      const retryable = !status || status === 429 || status >= 500;

      return {
        ok: false,
        httpStatus: status,
        body,
        fbtraceId: body?.error?.fbtrace_id,
        retryable,
        errorMessage: body?.error?.message ?? err.message,
      };
    }

    return {
      ok: false,
      retryable: true,
      errorMessage: err instanceof Error ? err.message : "Unknown send error",
    };
  }
};
