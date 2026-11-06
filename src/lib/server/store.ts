import "server-only";
import {photoSettingsSchema} from "../photo-persona";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { personaContentSchema, type PersonaContent } from "../schemas";
import { encrypt, decrypt } from "../crypto";
import type { Game } from "../game";
import type { Conversation } from "../conversation";
import { isDemo } from "./config";

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
  if (!isDemo()) throw new Error("Encryption key required outside demo mode");
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
  await mkdir(dataDir(), { recursive: true });
  const target = join(dataDir(), `${capsule.personaId}.json`);
  const temp = `${target}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(encrypt(capsule, await key())), { mode: 0o600 });
  await rename(temp, target);
}
export async function loadCapsule(id: string): Promise<Capsule> {
  if (!z.string().uuid().safeParse(id).success) throw new Error("Invalid capsule ID");
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
export function createDraft(ownerId: string, content: PersonaContent): Draft {
  const draft = { id: randomUUID(), ownerId, content: personaContentSchema.parse(content), expiresAt: Date.now() + 60 * 60_000 };
  state.drafts.set(draft.id, draft);
  return draft;
}
