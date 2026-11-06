import "server-only";
import { z } from "zod";
import type { Identity } from "./store";
import { ApiError } from "./security";
import { isDemo } from "./config";

const verifiedMatch = z.object({ matchId: z.string(), agentPersonaId: z.string().uuid(), simulationConsent: z.literal(true), playerSubject: z.string(), expiresAt: z.number() });
async function matchingFetch(path: string, subject: string, init?: RequestInit) {
  const base = process.env.MATCHING_API_URL;
  const token = process.env.MATCHING_API_TOKEN;
  if (!base || !token) throw new ApiError(503, "マッチングサービスが未設定です。担当者に確認してください。");
  const url = new URL(base);
  if (url.protocol !== "https:" && !["127.0.0.1", "localhost"].includes(url.hostname)) throw new ApiError(503, "マッチング接続先の設定が無効です。");
  try {
    const response = await fetch(`${base.replace(/\/$/, "")}${path}`, { ...init, cache: "no-store", signal: AbortSignal.timeout(8000), headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Player-Subject": subject, ...init?.headers } });
    if (!response.ok) throw new Error("Matching request failed");
    return await response.json() as unknown;
  } catch { throw new ApiError(502, "マッチングサービスに接続できません。時間をおいて再試行してください。"); }
}
export async function verifyMatch(identity: Identity, matchId: string, personaId: string) {
  if (isDemo()) {
    if (matchId !== "demo-match") throw new ApiError(403, "デモ用マッチを選んでください。");
    return;
  }
  if (!identity.subject) throw new ApiError(401, "マッチング元でログインしてください。");
  const parsed = verifiedMatch.safeParse(await matchingFetch(`/matches/${encodeURIComponent(matchId)}`, identity.subject));
  if (!parsed.success || parsed.data.matchId !== matchId || parsed.data.agentPersonaId !== personaId || parsed.data.playerSubject !== identity.subject || parsed.data.expiresAt * 1000 <= Date.now()) throw new ApiError(403, "マッチの権限・利用同意を確認できません。");
}
export async function sendDateRequest(identity: Identity, matchId: string, gameId: string) {
  if (isDemo()) return { id: `demo-request-${gameId}`, demo: true };
  if (!identity.subject) throw new ApiError(401, "ログインが必要です。");
  const schema = z.object({ requestId: z.string().min(1), status: z.enum(["pending", "accepted"]) });
  const parsed = schema.safeParse(await matchingFetch("/date-requests", identity.subject, { method: "POST", headers: { "Idempotency-Key": gameId }, body: JSON.stringify({ matchId, gameSessionId: gameId }) }));
  if (!parsed.success) throw new ApiError(502, "申請結果を確認できませんでした。同じ申請で再試行してください。");
  return { id: parsed.data.requestId, demo: false };
}
