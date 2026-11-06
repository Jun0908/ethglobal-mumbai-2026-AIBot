import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cleanup, state, type Identity } from "./store";
import { isDemo } from "./config";

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
const cookieName = "masala_session";
export function rateLimit(key: string, max = 40, windowMs = 60_000) {
  const now = Date.now();
  let bucket = state.limits.get(key);
  if (!bucket || bucket.until <= now) { bucket = { count: 0, until: now + windowMs }; state.limits.set(key, bucket); }
  bucket.count += 1;
  if (bucket.count > max) throw new ApiError(429, "利用回数の上限です。少し待ってから再試行してください。");
}
export function checkOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) throw new ApiError(403, "この送信元からは操作できません。");
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new ApiError(403, "この送信元からは操作できません。");
}
export function identity(request: NextRequest): Identity {
  cleanup();
  const token = request.cookies.get(cookieName)?.value;
  const session = token ? state.identities.get(token) : undefined;
  if (!session) throw new ApiError(401, "セッションが切れました。ページを再読み込みしてください。");
  rateLimit(`owner:${session.ownerId}`);
  return session;
}
function verifyAssertion(token: string) {
  const secret = process.env.MATCHING_IDENTITY_SECRET;
  if (!secret || secret.length < 32) throw new ApiError(503, "本人確認サービスが未設定です。");
  const parts = token.split(".");
  if (parts.length !== 2) throw new ApiError(401, "本人確認トークンが無効です。");
  const [payload, signature] = parts;
  const actual = Buffer.from(signature, "base64url");
  const expected = createHmac("sha256", secret).update(payload).digest();
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new ApiError(401, "本人確認トークンが無効です。");
  const schema = z.object({ sub: z.string().min(1).max(100), exp: z.number(), aud: z.literal("love-match-masala") });
  let claims: z.infer<typeof schema>;
  try { claims = schema.parse(JSON.parse(Buffer.from(payload, "base64url").toString())); }
  catch { throw new ApiError(401, "本人確認トークンが無効です。"); }
  if (claims.exp * 1000 <= Date.now() || claims.exp * 1000 > Date.now() + 15 * 60_000) throw new ApiError(401, "本人確認トークンの期限が無効です。");
  return claims.sub;
}
export function createIdentity(request: NextRequest, assertion?: string) {
  cleanup();
  rateLimit("new-session-global", 60);
  const previous = request.cookies.get(cookieName)?.value;
  const existing = previous ? state.identities.get(previous) : undefined;
  if (existing && !assertion) return { identity: existing, token: previous! };
  const subject = isDemo() ? null : verifyAssertion(assertion || "");
  const token = randomBytes(32).toString("base64url");
  const session = { ownerId: subject ? `psi:${subject}` : randomBytes(24).toString("base64url"), subject, expiresAt: Date.now() + 8 * 60 * 60_000 };
  state.identities.set(token, session);
  if (previous) state.identities.delete(previous);
  return { identity: session, token };
}
export function setIdentityCookie(response: NextResponse, token: string, request: NextRequest) {
  response.cookies.set(cookieName, token, { httpOnly: true, sameSite: "strict", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 8 * 60 * 60 });
}
export async function readBody(request: NextRequest) {
  // Enforce a limit on streamed/chunked requests as well as Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "入力がありません。");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.byteLength;
    if (size > 32_000) { await reader.cancel(); throw new ApiError(413, "入力が長すぎます。"); }
    chunks.push(part.value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown; }
  catch { throw new ApiError(400, "入力形式が正しくありません。"); }
}
export async function locked<T>(key: string, run: () => Promise<T>): Promise<T> {
  if (state.locks.has(key)) throw new ApiError(409, "処理中です。完了を待ってください。");
  state.locks.add(key);
  try { return await run(); } finally { state.locks.delete(key); }
}
export function checkPrivateText(text: string) {
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:\+?\d[\d ()-]{8,}\d)|https?:\/\//i.test(text);
}
export function ensureNoPrivateText(value: unknown) {
  if (checkPrivateText(JSON.stringify(value))) throw new ApiError(422, "メール・電話番号・URLを除いてください。個人を特定する名前や住所も確認してください。");
}
export function outputGuard(text: string): string {
  if (checkPrivateText(text) || /personaId|behaviorExamples|system prompt|秘密のPersona|承認済みPersona.*[:：]/i.test(text)) {
    return "その情報はお伝えできないけれど、ここでの会話を楽しみたいな。あなたはどんな場所で過ごすのが好き？";
  }
  return text;
}
