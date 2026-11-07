import "server-only";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { z } from "zod";
import { decrypt, encrypt } from "../crypto";
import { identityKey } from "./identity-store";
import { sharedKeys, sharedRead, sharedRedis, sharedWrite } from "./redis-store";

const schema = z.object({ id: z.string().uuid(), tokenHash: z.string().length(64), ownerId: z.string(), personaId: z.string().uuid(), version: z.number().int().positive(), expiresAt: z.number().int(), revoked: z.boolean() });
type Invitation = z.infer<typeof schema>;
const directory = () => resolve(/* turbopackIgnore: true */ process.env.PERSONA_DATA_DIR || ".data/personas", "..", "invitations");
const path = (id: string) => join(directory(), `${id}.json`);

async function read(id: string): Promise<Invitation | undefined> {
  if (!z.string().uuid().safeParse(id).success) return;
  if (sharedRedis()) {
    const record = await sharedRead<Invitation>(`invite:${id}`, identityKey());
    return record ? schema.parse(record) : undefined;
  }
  try { return schema.parse(decrypt(JSON.parse(readFileSync(path(id), "utf8")), identityKey())); }
  catch { return; }
}
async function write(record: Invitation) {
  const valid = schema.parse(record);
  if (sharedRedis()) { await sharedWrite(`invite:${valid.id}`, valid, identityKey(), valid.expiresAt); return; }
  mkdirSync(directory(), { recursive: true });
  const target = path(valid.id), temp = `${target}.${randomUUID()}.tmp`;
  writeFileSync(temp, JSON.stringify(encrypt(valid, identityKey())), { mode: 0o600 });
  renameSync(temp, target);
}
export async function createInvitation(ownerId: string, personaId: string, version: number) {
  const id = randomUUID(), secret = randomBytes(32).toString("base64url");
  const record: Invitation = { id, tokenHash: createHash("sha256").update(secret).digest("hex"), ownerId, personaId, version, expiresAt: Date.now() + 7 * 86400_000, revoked: false };
  await write(record);
  return { id, token: `${id}.${secret}`, expiresAt: record.expiresAt };
}
export async function validateInvitation(token: string) {
  const [id, secret, ...rest] = token.split(".");
  if (rest.length || !z.string().uuid().safeParse(id).success || !/^[A-Za-z0-9_-]{43}$/.test(secret || "")) return;
  const record = await read(id);
  if (!record || record.revoked || record.expiresAt <= Date.now()) return;
  const hash = createHash("sha256").update(secret).digest(), expected = Buffer.from(record.tokenHash, "hex");
  return timingSafeEqual(hash, expected) ? record : undefined;
}
export async function revokeInvitation(id: string, ownerId: string) {
  const record = await read(id);
  if (!record || record.ownerId !== ownerId) return false;
  record.revoked = true;
  await write(record);
  return true;
}
export async function ownerInvitations(ownerId: string, personaId: string) {
  const ids = sharedRedis()
    ? (await sharedKeys("invite:*")).map(key => key.slice(7))
    : (() => { try { return readdirSync(directory()).filter(name => /^[0-9a-f-]{36}\.json$/.test(name)).map(name => name.slice(0, -5)); } catch { return []; } })();
  const records = await Promise.all(ids.map(read));
  return records.filter((v): v is Invitation => !!v && v.ownerId === ownerId && v.personaId === personaId && !v.revoked && v.expiresAt > Date.now()).map(({ id, expiresAt }) => ({ id, expiresAt }));
}
