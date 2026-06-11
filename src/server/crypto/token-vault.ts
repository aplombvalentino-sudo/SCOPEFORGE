/* ================================================================
   Token vault — AES-256-GCM encryption for OAuth token sets.

   Ciphertext format:  "<keyId>:" + base64(iv[12] || authTag[16] || data)
   The key-id prefix lets keys rotate: encryption always uses the
   current key; decryption resolves the key by the id baked into the
   ciphertext, so old rows stay readable while a re-encryption job
   migrates them.

   Key sources (never hardcoded):
     SCOPEFORGE_VAULT_KEY          current key, base64, exactly 32 bytes (id "v1")
     SCOPEFORGE_VAULT_RETIRED_KEYS optional decrypt-only keys, "id:base64,id:base64"

   Production swap points: none — this is the production implementation.
   A KMS-wrapped data-key envelope can slot in later as a new key id
   without changing the ciphertext contract.

   Error hygiene: failures throw generic messages. No key material,
   no plaintext, no cipher internals ever appear in an error.
   ================================================================ */

import { Buffer } from "node:buffer";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
const CURRENT_KEY_ID = "v1";

/**
 * Constant-time string comparison. Both inputs are hashed first so the
 * comparison cost is independent of input length (timingSafeEqual
 * requires equal-length buffers and would otherwise leak length).
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const digestA = createHash("sha256").update(a, "utf8").digest();
  const digestB = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(digestA, digestB);
}

function parseKey(value: string | undefined): Buffer | null {
  if (!value) return null;
  const key = Buffer.from(value, "base64");
  return key.length === KEY_BYTES ? key : null;
}

export interface TokenVaultOptions {
  /** Full keyring: key id → 32-byte key. Overrides env entirely. */
  keys?: Map<string, Buffer>;
  /** Which keyring entry new ciphertexts are written with. */
  currentKeyId?: string;
}

export class TokenVault {
  private readonly keys = new Map<string, Buffer>();
  private readonly currentKeyId: string;

  constructor(options?: TokenVaultOptions) {
    this.currentKeyId = options?.currentKeyId ?? CURRENT_KEY_ID;

    if (options?.keys) {
      for (const [id, key] of options.keys) {
        if (key.length === KEY_BYTES) this.keys.set(id, key);
      }
      return;
    }

    const current = parseKey(process.env.SCOPEFORGE_VAULT_KEY);
    if (current) this.keys.set(CURRENT_KEY_ID, current);

    // Retired decrypt-only keys for rotation, e.g. "v0:<base64>,vx:<base64>".
    const retired = process.env.SCOPEFORGE_VAULT_RETIRED_KEYS ?? "";
    for (const entry of retired.split(",")) {
      const sep = entry.indexOf(":");
      if (sep <= 0) continue;
      const id = entry.slice(0, sep).trim();
      const key = parseKey(entry.slice(sep + 1).trim());
      if (id && key) this.keys.set(id, key);
    }
  }

  /** True when a valid current key is loaded. Absent key → sandbox mode upstream. */
  isConfigured(): boolean {
    return this.keys.has(this.currentKeyId);
  }

  encrypt(plaintext: string): string {
    const key = this.keys.get(this.currentKeyId);
    if (!key) {
      throw new Error(
        "vault: not configured — set SCOPEFORGE_VAULT_KEY (base64, exactly 32 bytes)"
      );
    }
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${this.currentKeyId}:${Buffer.concat([iv, tag, data]).toString("base64")}`;
  }

  decrypt(ciphertext: string): string {
    const sep = ciphertext.indexOf(":");
    if (sep <= 0) {
      throw new Error("vault: ciphertext is missing its key id prefix");
    }
    const keyId = ciphertext.slice(0, sep);
    const key = this.keys.get(keyId);
    if (!key) {
      // The key id is an opaque label, never key material — safe to echo.
      throw new Error(`vault: no key in the keyring for id "${keyId}"`);
    }
    const raw = Buffer.from(ciphertext.slice(sep + 1), "base64");
    if (raw.length < IV_BYTES + TAG_BYTES) {
      throw new Error("vault: ciphertext is too short to be valid");
    }
    const iv = raw.subarray(0, IV_BYTES);
    const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const data = raw.subarray(IV_BYTES + TAG_BYTES);
    try {
      const decipher = createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    } catch {
      // Deliberately generic: never surface cipher internals or key material.
      throw new Error("vault: decryption failed — integrity check did not pass");
    }
  }
}
