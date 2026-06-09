import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const getSecret = () => {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not set");
  }
  // Make sure it's 32 bytes for AES-256-GCM
  return Buffer.from(secret).subarray(0, 32);
};

export function encryptKey(plaintext: string): { encryptedKey: string; iv: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", getSecret(), iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encryptedKey: `${encrypted}:${authTag}`,
    iv: iv.toString("hex"),
  };
}

export function decryptKey(encryptedKey: string, ivHex: string): string {
  const [encrypted, authTag] = encryptedKey.split(":");
  if (!encrypted || !authTag) {
    throw new Error("Invalid encrypted key format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", getSecret(), iv);
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
