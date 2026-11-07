import "server-only";
import {photoSettingsSchema} from "../photo-persona";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { personaContentSchema, type PersonaContent } from "../schemas";
import { encrypt, decrypt } from "../crypto";
import type { Game } from "../game";
import type { Conversation } from "../conversation";
import { isDemo } from "./config";
import { sharedKeys, sharedRead, sharedRedis, sharedWrite } from "./redis-store";

export const capsuleSchema = z.object({
  personaId: z.string().uuid(), ownerId: z.string(), version: z.number().int().positive(),
  content: personaContentSchema,
  visual: photoSettingsSchema.optional(),
  boundaries: z.object({ revealPrivateInformation: z.literal(false), allowSensitiveQuestions: z.literal(false) }),
  consent: z.object({ simulationApproved: z.boolean(), approvedAt: z.string().nullable() }),
});
export type Capsule = z.infer<typeof capsuleSchema>;
export type Draft = { id: string; ownerId: string; content: PersonaContent; expiresAt: number; visual?: Capsule["visual"] };
export type Identity = { ownerId: string; subject: string | null; expiresAt: number; personaIds: string[] };
type State = {
  conversations: Map<string, Conversation>;
  identities: Map<string, Identity>; drafts: Map<string, Draft>; games: Map<string, Game>;
  limits: Map<string, { count: number; until: number }>; locks: Set<string>;
  requests: Map<string, { id: string; demo: boolean }>; key?: Promise<Buffer>;
};
const root = globalThis as typeof globalThis & { masalaState?: State };
export const state: State = root.masalaState ??= { conversations: new Map(), identities: new Map(), drafts: new Map(), games: new Map(), limits: new Map(), locks: new Set(), requests: new Map() };
state.conversations ??= new Map();
// Runtime-only private storage must never become part of the deployment trace.
const dataDir = () => resolve(/* turbopackIgnore: true */ process.env.PERSONA_DATA_DIR || ".data/personas");

async function loadKey() {
  const supplied = process.env.PERSONA_ENCRYPTION_KEY?.trim();
  if (supplied) {
    if (!/^[a-f\d]{64}$/i.test(supplied)) throw new Error("Encryption key must be 32 bytes in hex");
    return Buffer.from(supplied, "hex");
  }
  if (!isDemo() || process.env.VERCEL || sharedRedis()) throw new Error("Encryption key required outside local demo mode");
  const directory = resolve(".data");
  await mkdir(directory, { recursive: true });
  const path = join(directory, "demo-encryption-key");
  try { await writeFile(path, randomBytes(32), { flag: "wx", mode: 0o600 }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
  const key = await readFile(path);
  if (key.length !== 32) throw new Error("Invalid demo key");
  return key;
}
export function storageKey() { return state.key ??= loadKey(); }
const key = storageKey;
export async function saveCapsule(capsule: Capsule) {
  capsuleSchema.parse(capsule);
  if (sharedRedis()) { await sharedWrite(`capsule:${capsule.personaId}`, capsule, await key()); return; }
  await mkdir(dataDir(), { recursive: true });
  const target = join(dataDir(), `${capsule.personaId}.json`);
  const temp = `${target}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(encrypt(capsule, await key())), { mode: 0o600 });
  await rename(temp, target);
}
export async function loadCapsule(id: string): Promise<Capsule> {
  if (!z.string().uuid().safeParse(id).success) throw new Error("Invalid capsule ID");
  if (sharedRedis()) {
    const capsule = await sharedRead<Capsule>(`capsule:${id}`, await key());
    if (!capsule) throw new Error("Capsule not found");
    return capsuleSchema.parse(capsule);
  }
  const raw = await readFile(join(dataDir(), `${id}.json`), "utf8");
  return capsuleSchema.parse(decrypt(JSON.parse(raw), await key()));
}
export function cleanup() {
  const now = Date.now();
  for (const map of [state.identities, state.drafts, state.games, state.conversations]) {
    for (const [id, entry] of map) if (entry.expiresAt <= now) map.delete(id);
  }
  for (const [id, entry] of state.limits) if (entry.until <= now) state.limits.delete(id);
}
export async function createDraft(ownerId: string, content: PersonaContent): Promise<Draft> {
  const draft = { id: randomUUID(), ownerId, content: personaContentSchema.parse(content), expiresAt: Date.now() + 60 * 60_000 };
  if (sharedRedis()) await sharedWrite(`draft:${draft.id}`, draft, await key(), draft.expiresAt);
  else state.drafts.set(draft.id, draft);
  return draft;
}

export async function loadDraft(id: string): Promise<Draft | undefined> {
  if (!z.string().uuid().safeParse(id).success) return;
  return sharedRedis() ? (await sharedRead<Draft>(`draft:${id}`, await key())) ?? undefined : state.drafts.get(id);
}
export async function saveDraft(draft: Draft) {
  if (sharedRedis()) await sharedWrite(`draft:${draft.id}`, draft, await key(), draft.expiresAt);
  else state.drafts.set(draft.id, draft);
}
export async function deleteDraft(id: string) {
  const redis = sharedRedis();
  if (redis) await redis.del(`draft:${id}`);
  else state.drafts.delete(id);
}
export async function deleteOwnerDrafts(ownerId: string) {
  if (sharedRedis()) {
    for (const name of await sharedKeys("draft:*")) {
      const draft = await sharedRead<Draft>(name, await key());
      if (draft?.ownerId === ownerId) await sharedRedis()!.del(name);
    }
  } else for (const [id, draft] of state.drafts) if (draft.ownerId === ownerId) state.drafts.delete(id);
}
export async function loadGame(id: string): Promise<Game | undefined> {
  if (!z.string().uuid().safeParse(id).success) return;
  return sharedRedis() ? (await sharedRead<Game>(`game:${id}`, await key())) ?? undefined : state.games.get(id);
}
export async function saveGame(game: Game) {
  if (sharedRedis()) await sharedWrite(`game:${game.id}`, game, await key(), game.expiresAt);
  else state.games.set(game.id, game);
}
export async function loadDateRequest(id: string): Promise<{ id: string; demo: boolean } | undefined> {
  if (!z.string().uuid().safeParse(id).success) return;
  return sharedRedis() ? (await sharedRead<{ id: string; demo: boolean }>(`date-request:${id}`, await key())) ?? undefined : state.requests.get(id);
}
export async function saveDateRequest(id: string, value: { id: string; demo: boolean }, expiresAt: number) {
  if (sharedRedis()) await sharedWrite(`date-request:${id}`, value, await key(), expiresAt);
  else state.requests.set(id, value);
}
export async function deleteDateRequest(id: string) {
  const redis = sharedRedis();
  if (redis) await redis.del(`date-request:${id}`);
  else state.requests.delete(id);
}
export async function loadConversation(id: string): Promise<Conversation | undefined> {
  if (!z.string().uuid().safeParse(id).success) return;
  return sharedRedis() ? (await sharedRead<Conversation>(`conversation:${id}`, await key())) ?? undefined : state.conversations.get(id);
}
export async function saveConversation(conversation: Conversation) {
  const redis = sharedRedis();
  if (redis) {
    const index = `owner-conversations:${createHash("sha256").update(conversation.ownerId).digest("hex")}`;
    await sharedWrite(`conversation:${conversation.id}`, conversation, await key(), conversation.expiresAt);
    await redis.sadd(index, conversation.id);
    await redis.expire(index, 2 * 60 * 60);
  } else state.conversations.set(conversation.id, conversation);
}
export async function ownerConversations(ownerId: string): Promise<Conversation[]> {
  const redis = sharedRedis();
  if (!redis) return [...state.conversations.values()].filter(c => c.ownerId === ownerId && c.expiresAt > Date.now());
  const index = `owner-conversations:${createHash("sha256").update(ownerId).digest("hex")}`;
  const ids = await redis.smembers<string[]>(index);
  const encryptionKey = await key();
  const values = await Promise.all(ids.map(id => sharedRead<Conversation>(`conversation:${id}`, encryptionKey)));
  await Promise.all(ids.filter((_, i) => !values[i]).map(id => redis.srem(index, id)));
  return values.filter((c): c is Conversation => !!c && c.ownerId === ownerId && c.expiresAt > Date.now());
}
