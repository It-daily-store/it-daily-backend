import crypto from "crypto";
import httpStatus from "http-status";
import config from "../../config";
import AppError from "../../errors/AppError";

const ALGORITHM = "aes-256-gcm";

const getKey = (): Buffer => {
  const raw = config.meta_pixel_encryption_key;

  if (!raw) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "META_PIXEL_ENCRYPTION_KEY is not configured",
    );
  }

  const key = Buffer.from(raw, "hex");

  if (key.length !== 32) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "META_PIXEL_ENCRYPTION_KEY must be 32 bytes of hex",
    );
  }

  return key;
};

export const encryptToken = (plain: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);

  return [
    iv.toString("hex"),
    cipher.getAuthTag().toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
};

export const decryptToken = (stored: string): string => {
  const [ivHex, tagHex, dataHex] = stored.split(":");

  if (!ivHex || !tagHex || !dataHex) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Stored Meta access token is malformed",
    );
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
};

export const maskToken = (plain: string): string => plain.slice(-4);
