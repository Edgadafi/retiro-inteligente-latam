import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const SCRYPT_OPTIONS = { N: 2 ** 17, r: 8, p: 1 };

export interface EncryptedWalletEnvelope {
  v: 1;
  enc: true;
  alg: typeof ALGORITHM;
  salt: string;
  iv: string;
  tag: string;
  data: string;
}

function deriveKey(masterKey: string, salt: Buffer): Buffer {
  if (/^[0-9a-f]{64}$/i.test(masterKey)) {
    return Buffer.from(masterKey, "hex");
  }
  return scryptSync(masterKey, salt, KEY_LENGTH, SCRYPT_OPTIONS);
}

export function isEncryptedWalletPayload(raw: string): boolean {
  try {
    const parsed = JSON.parse(raw) as Partial<EncryptedWalletEnvelope>;
    return parsed.enc === true && parsed.v === 1;
  } catch {
    return false;
  }
}

/**
 * Cifra el export del wallet CDP con AES-256-GCM.
 * En producción usar WALLET_MASTER_KEY desde KMS/HSM; nunca commitear la clave.
 */
export function encryptWallet(plaintext: string, masterKey: string): string {
  if (!masterKey || masterKey.length < 32) {
    throw new Error("WALLET_MASTER_KEY inválida: mínimo 32 caracteres o 64 hex.");
  }

  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(masterKey, salt);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const envelope: EncryptedWalletEnvelope = {
    v: 1,
    enc: true,
    alg: ALGORITHM,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  };

  return JSON.stringify(envelope);
}

export function decryptWallet(ciphertext: string, masterKey: string): string {
  if (!masterKey || masterKey.length < 32) {
    throw new Error("WALLET_MASTER_KEY requerida para descifrar el monedero.");
  }

  const envelope = JSON.parse(ciphertext) as EncryptedWalletEnvelope;
  if (envelope.enc !== true || envelope.v !== 1 || envelope.alg !== ALGORITHM) {
    throw new Error("Formato de wallet cifrado no soportado.");
  }

  const salt = Buffer.from(envelope.salt, "base64");
  const iv = Buffer.from(envelope.iv, "base64");
  const tag = Buffer.from(envelope.tag, "base64");
  const data = Buffer.from(envelope.data, "base64");
  const key = deriveKey(masterKey, salt);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

/** Compara claves de forma segura (útil para validar master key en health checks). */
export function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
