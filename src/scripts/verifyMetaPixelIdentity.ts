import assert from "assert";
import {
  decryptToken,
  encryptToken,
  maskToken,
} from "../app/modules/metaPixel/metaPixel.crypto";
import {
  buildFbc,
  hashIdentity,
  isBotUserAgent,
  isIpExcluded,
} from "../app/modules/metaPixel/metaPixel.identity";

const run = () => {
  // crypto round trip
  const token = "EAAG_placeholder_token_value_1234";
  const stored = encryptToken(token);
  assert.notStrictEqual(stored, token, "ciphertext must differ from plaintext");
  assert.strictEqual(decryptToken(stored), token, "round trip must restore");
  assert.notStrictEqual(
    encryptToken(token),
    stored,
    "random IV must produce different ciphertext each time",
  );
  assert.strictEqual(maskToken(token), "1234");

  // a tampered payload must throw, not silently return garbage
  assert.throws(() => decryptToken(stored.slice(0, -2) + "00"));

  // email: trim + lowercase before hashing
  const expectedEmail =
    "973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b";
  assert.strictEqual(hashIdentity("  Test@Example.com ", "em"), expectedEmail);
  assert.strictEqual(hashIdentity("test@example.com", "em"), expectedEmail);

  // phone: digits only, Bangladesh local form gets the country code
  assert.strictEqual(
    hashIdentity("01712-345678", "ph"),
    hashIdentity("8801712345678", "ph"),
  );
  assert.strictEqual(
    hashIdentity("+880 1712 345678", "ph"),
    hashIdentity("8801712345678", "ph"),
  );

  // zip: digits only. country: lowercase two-letter
  assert.strictEqual(hashIdentity("1207-A", "zp"), hashIdentity("1207", "zp"));
  assert.strictEqual(
    hashIdentity("BD", "country"),
    hashIdentity("bd", "country"),
  );

  // external_id is an opaque id: not lowercased, only trimmed
  assert.notStrictEqual(
    hashIdentity("AbC123", "external_id"),
    hashIdentity("abc123", "external_id"),
  );

  // empty in, empty out — never hash a blank string
  assert.strictEqual(hashIdentity("", "em"), undefined);
  assert.strictEqual(hashIdentity("   ", "em"), undefined);
  assert.strictEqual(hashIdentity(undefined, "em"), undefined);

  assert.strictEqual(
    buildFbc("IwAR123", 1757370000000),
    "fb.1.1757370000000.IwAR123",
  );

  assert.strictEqual(isIpExcluded("203.0.113.7", ["203.0.113.7"]), true);
  assert.strictEqual(isIpExcluded("203.0.113.7", ["203.0.113.0/24"]), true);
  assert.strictEqual(isIpExcluded("203.0.114.7", ["203.0.113.0/24"]), false);
  assert.strictEqual(isIpExcluded(undefined, ["203.0.113.0/24"]), false);
  assert.strictEqual(isIpExcluded("203.0.113.7", []), false);

  assert.strictEqual(
    isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)"),
    true,
  );
  assert.strictEqual(isBotUserAgent("facebookexternalhit/1.1"), true);
  assert.strictEqual(
    isBotUserAgent("Mozilla/5.0 (Windows NT 10.0) Chrome/128.0"),
    false,
  );
  assert.strictEqual(isBotUserAgent(undefined), false);

  console.log("all meta pixel identity assertions passed");
};

run();
