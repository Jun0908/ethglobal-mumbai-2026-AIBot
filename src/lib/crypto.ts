import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export function encrypt(value: unknown, key: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from("love-match-persona:v1"));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return { version: 1, iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ciphertext: ciphertext.toString("base64") };
}
export function decrypt(value: ReturnType<typeof encrypt>, key: Buffer): unknown {
  if (value.version !== 1) throw new Error("Unsupported capsule version");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(value.iv, "base64"));
  decipher.setAAD(Buffer.from("love-match-persona:v1"));
  decipher.setAuthTag(Buffer.from(value.tag, "base64"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(value.ciphertext, "base64")), decipher.final()]).toString("utf8"));
}
