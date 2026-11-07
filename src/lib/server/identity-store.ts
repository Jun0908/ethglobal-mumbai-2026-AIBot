import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync, unlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { z } from "zod";
import { decrypt, encrypt } from "../crypto";
import { isDemo } from "./config";
import { sharedRead, sharedRedis, sharedWrite } from "./redis-store";

const sessionSchema = z.object({
  ownerId: z.string().min(1), subject: z.string().nullable(),
  expiresAt: z.number().int(), personaIds: z.array(z.string().uuid()),
});
export type StoredIdentity = z.infer<typeof sessionSchema>;
const directory = () => resolve(/* turbopackIgnore: true */ process.env.PERSONA_DATA_DIR || ".data/personas", "..", "identities");
const filename = (token: string) => join(directory(), `${createHash("sha256").update(token).digest("hex")}.json`);
export function identityKey() {
  const supplied = process.env.PERSONA_ENCRYPTION_KEY?.trim();
  if (supplied) {
    if (!/^[a-f\d]{64}$/i.test(supplied)) throw new Error("Encryption key must be 32 bytes in hex");
    return Buffer.from(supplied, "hex");
  }
  if (!isDemo() || process.env.VERCEL || sharedRedis()) throw new Error("Encryption key required outside local demo mode");
  const dir = resolve(".data");
  mkdirSync(dir, { recursive: true });
  const keyPath = join(dir, "demo-encryption-key");
  try { writeFileSync(keyPath, randomBytes(32), { flag: "wx", mode: 0o600 }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
  const key = readFileSync(keyPath);
  if (key.length !== 32) throw new Error("Invalid demo key");
  return key;
}
export async function loadIdentity(token: string): Promise<StoredIdentity | undefined> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return undefined;
  if (sharedRedis()) {
    const value = await sharedRead<StoredIdentity>(`identity:${createHash("sha256").update(token).digest("hex")}`, identityKey());
    if (!value) return undefined;
    const record = sessionSchema.parse(value);
    if (record.expiresAt > Date.now()) return record;
    await deleteIdentity(token);
    return undefined;
  }
  try {
    const record = sessionSchema.parse(decrypt(JSON.parse(readFileSync(filename(token), "utf8")), identityKey()));
    if (record.expiresAt > Date.now()) return record;
    await deleteIdentity(token);
  } catch { /* Missing, expired, or unreadable sessions are invalid. */ }
  return undefined;
}
export async function saveIdentity(token: string, identity: StoredIdentity) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error("Invalid session token");
  const record = sessionSchema.parse(identity);
  if (sharedRedis()) { await sharedWrite(`identity:${createHash("sha256").update(token).digest("hex")}`, record, identityKey(), record.expiresAt); return; }
  mkdirSync(directory(), { recursive: true });
  const target = filename(token);
  const temp = `${target}.${randomUUID()}.tmp`;
  writeFileSync(temp, JSON.stringify(encrypt(record, identityKey())), { mode: 0o600 });
  renameSync(temp, target);
}
export async function deleteIdentity(token: string) {
  const redis = sharedRedis();
  if (redis) { await redis.del(`identity:${createHash("sha256").update(token).digest("hex")}`); return; }
  try { unlinkSync(filename(token)); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
}
