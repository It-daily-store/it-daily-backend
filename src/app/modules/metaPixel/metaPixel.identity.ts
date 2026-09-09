import crypto from "crypto";

export type TIdentityKind =
  | "em"
  | "ph"
  | "fn"
  | "ln"
  | "ct"
  | "st"
  | "zp"
  | "country"
  | "external_id";

const BOT_UA_PATTERN =
  /bot|crawler|spider|crawling|facebookexternalhit|slurp|bingpreview|headlesschrome|lighthouse|pingdom|semrush|ahrefs/i;

// Meta requires E.164 digits with no plus. Local Bangladesh numbers arrive as
// 01XXXXXXXXX, so the leading zero is replaced with the country code.
const normalizePhone = (value: string): string => {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("880")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `880${digits.slice(1)}`;
  }

  return digits;
};

const normalize = (value: string, kind: TIdentityKind): string => {
  const trimmed = value.trim();

  switch (kind) {
    case "ph":
      return normalizePhone(trimmed);
    case "zp":
      return trimmed.replace(/\D/g, "");
    case "external_id":
      return trimmed;
    default:
      return trimmed.toLowerCase();
  }
};

export const hashIdentity = (
  value: string | undefined,
  kind: TIdentityKind,
): string | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = normalize(value, kind);

  if (!normalized) {
    return undefined;
  }

  return crypto.createHash("sha256").update(normalized).digest("hex");
};

export const buildFbc = (fbclid: string, timestampMs: number): string =>
  `fb.1.${timestampMs}.${fbclid}`;

const ipToLong = (ip: string): number | null => {
  const parts = ip.split(".");

  if (parts.length !== 4) {
    return null;
  }

  // Validate all octets are integers in 0..255 before any bitwise operations
  const octets: (number | null)[] = parts.map((part) => {
    const octet = Number(part);
    return Number.isInteger(octet) && octet >= 0 && octet <= 255 ? octet : null;
  });

  if (octets.some((o) => o === null)) {
    return null;
  }

  return (octets as number[]).reduce((acc, octet) => (acc << 8) + octet, 0);
};

export const isIpExcluded = (
  ip: string | undefined,
  patterns: string[],
): boolean => {
  if (!ip || !patterns.length) {
    return false;
  }

  const target = ipToLong(ip);

  return patterns.some((pattern) => {
    if (!pattern.includes("/")) {
      return pattern.trim() === ip;
    }

    const [network, bitsRaw] = pattern.split("/");
    const bits = Number(bitsRaw);
    const networkLong = ipToLong(network.trim());

    if (target === null || networkLong === null || Number.isNaN(target)) {
      return false;
    }

    if (!Number.isInteger(bits) || bits < 0 || bits > 32) {
      return false;
    }

    const mask = bits === 0 ? 0 : (-1 << (32 - bits)) >>> 0;

    return (target & mask) === (networkLong & mask);
  });
};

export const isBotUserAgent = (ua: string | undefined): boolean =>
  !!ua && BOT_UA_PATTERN.test(ua);
