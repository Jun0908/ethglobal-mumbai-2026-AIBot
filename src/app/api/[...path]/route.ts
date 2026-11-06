import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { answerSchema, approvedAnswersSchema, idSchema, scenarios } from "@/lib/schemas";
import { advanceGame, publicGame, retryGame, type Game } from "@/lib/game";
import { isDemo, llmMode } from "@/lib/server/config";
import { createDraft, loadCapsule, saveCapsule, state, type Capsule, type Identity } from "@/lib/server/store";
import { ApiError, checkOrigin, createIdentity, ensureNoPrivateText, identity, locked, readBody, setIdentityCookie } from "@/lib/server/security";
import { agentReply, extractPersona, nextQuestion, revisePersona } from "@/lib/server/llm";
import { demoPersona } from "@/lib/server/demo";
import { sendDateRequest, verifyMatch } from "@/lib/server/matching";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
function draftFor(id: string, ownerId: string) {
  const draft = state.drafts.get(id);
  if (!draft || draft.ownerId !== ownerId || draft.expiresAt < Date.now()) throw new ApiError(404, "下書きが見つかりません。インタビューからやり直してください。");
  return draft;
}
async function capsuleFor(id: string) {
  try { return await loadCapsule(id); } catch { throw new ApiError(404, "Personaを利用できません。"); }
}
async function authorizeGame(game: Game, person: Identity) {
  if (game.ownerId !== person.ownerId || game.expiresAt < Date.now()) throw new ApiError(404, "ゲームが見つかりません。");
  const capsule = await capsuleFor(game.personaId);
  if (!capsule.consent.simulationApproved || capsule.version !== game.personaVersion) throw new ApiError(403, "Personaの利用同意が撤回・更新されました。");
  if (isDemo() && capsule.ownerId !== person.ownerId) throw new ApiError(403, "このデモPersonaは利用できません。");
  await verifyMatch(person, game.matchId, game.personaId);
  return capsule;
}
function ownedGame(id: string, ownerId: string) {
  const game = state.games.get(id);
  if (!game || game.ownerId !== ownerId || game.expiresAt < Date.now()) throw new ApiError(404, "ゲームが見つかりません。");
  return game;
}
async function dispatch(path: string, body: unknown, person: Identity) {
  switch (path) {
    case "interview/next": {
      const input = z.object({ answers: z.array(answerSchema).max(12), skipped: z.number().int().min(0).max(12), sendApproved: z.literal(true) }).strict().parse(body);
      ensureNoPrivateText(input.answers);
      return nextQuestion(input.answers, input.skipped);
    }
    case "persona/extract": {
      const input = approvedAnswersSchema.parse(body);
      ensureNoPrivateText(input.answers);
      const content = await extractPersona(input.answers);
      const draft = createDraft(person.ownerId, content);
      return { draftId: draft.id, content: draft.content };
    }
    case "persona/calibrate": {
      const input = z.object({ draftId: idSchema, scenario: z.number().int().min(0).max(2) }).strict().parse(body);
      const draft = draftFor(input.draftId, person.ownerId);
      return agentReply(draft.content, scenarios[input.scenario], 0, []);
    }
    case "persona/revise": {
      const input = z.object({ draftId: idSchema, feedback: z.string().min(1).max(1200), sendApproved: z.literal(true) }).strict().parse(body);
      const current = draftFor(input.draftId, person.ownerId);
      ensureNoPrivateText(input.feedback);
      const proposal = createDraft(person.ownerId, await revisePersona(current.content, input.feedback));
      return { draftId: proposal.id, content: proposal.content };
    }
    case "persona/approve": {
      const input = z.object({ draftId: idSchema, simulationApproved: z.literal(true), examplesApproved: z.literal(true), adultConfirmed: z.literal(true) }).strict().parse(body);
      return locked(`draft:${input.draftId}`, async () => {
        const draft = draftFor(input.draftId, person.ownerId);
        ensureNoPrivateText(draft.content);
        const capsule: Capsule = { personaId: randomUUID(), ownerId: person.ownerId, version: 1, content: draft.content, boundaries: { revealPrivateInformation: false, allowSensitiveQuestions: false }, consent: { simulationApproved: true, approvedAt: new Date().toISOString() } };
        await saveCapsule(capsule);
        state.drafts.delete(draft.id);
        return { personaId: capsule.personaId, approved: true };
      });
    }
    case "persona/revoke": {
      const input = z.object({ personaId: z.string().uuid() }).strict().parse(body);
      return locked(`persona:${input.personaId}`, async () => {
        const capsule = await capsuleFor(input.personaId);
        if (capsule.ownerId !== person.ownerId) throw new ApiError(404, "Personaが見つかりません。");
        capsule.consent.simulationApproved = false;
        capsule.version += 1;
        await saveCapsule(capsule);
        for (const [id, draft] of state.drafts) if (draft.ownerId === person.ownerId) state.drafts.delete(id);
        return { revoked: true };
      });
    }
    case "game/start": {
      const input = z.object({ matchId: idSchema, agentPersonaId: idSchema, simulationConsent: z.boolean().optional() }).strict().parse(body);
      let personaId = input.agentPersonaId;
      if (isDemo() && ["demo-calm", "demo-playful"].includes(personaId)) {
        if (input.matchId !== "demo-match") throw new ApiError(403, "デモ用マッチを選んでください。");
        const capsule: Capsule = { personaId: randomUUID(), ownerId: person.ownerId, version: 1, content: demoPersona(personaId === "demo-calm" ? "calm" : "playful"), boundaries: { revealPrivateInformation: false, allowSensitiveQuestions: false }, consent: { simulationApproved: true, approvedAt: new Date().toISOString() } };
        await saveCapsule(capsule);
        personaId = capsule.personaId;
      }
      const capsule = await capsuleFor(personaId);
      if (!capsule.consent.simulationApproved || (isDemo() && capsule.ownerId !== person.ownerId)) throw new ApiError(403, "このPersonaの利用同意を確認できません。");
      await verifyMatch(person, input.matchId, personaId);
      const game: Game = { id: randomUUID(), ownerId: person.ownerId, personaId, personaVersion: capsule.version, matchId: input.matchId, scene: 0, sceneTurns: 0, completed: false, messages: [], checkpoint: 0, emotion: "neutral", event: "none", expiresAt: Date.now() + 2 * 60 * 60_000 };
      state.games.set(game.id, game);
      return publicGame(game);
    }
    case "game/message": {
      const input = z.object({ gameId: idSchema, message: z.string().trim().min(1).max(1200) }).strict().parse(body);
      return locked(`game:${input.gameId}`, async () => {
        const current = ownedGame(input.gameId, person.ownerId);
        if (current.completed) throw new ApiError(409, "この会話は終了しています。もう一度始めてください。");
        return locked(`persona:${current.personaId}`, async () => {
          const capsule = await authorizeGame(current, person);
          const reply = await agentReply(capsule.content, input.message, current.scene, current.messages);
          await authorizeGame(current, person);
          const next = advanceGame(current, input.message, reply);
          state.games.set(next.id, next);
          return { game: publicGame(next), reply };
        });
      });
    }
    case "game/retry": {
      const input = z.object({ gameId: idSchema }).strict().parse(body);
      return locked(`game:${input.gameId}`, async () => {
        const current = ownedGame(input.gameId, person.ownerId);
        await authorizeGame(current, person);
        const next = retryGame(current);
        state.games.set(next.id, next);
        state.requests.delete(next.id);
        return publicGame(next);
      });
    }
    case "date-request": {
      const input = z.object({ gameId: idSchema }).strict().parse(body);
      return locked(`game:${input.gameId}`, async () => {
        const game = ownedGame(input.gameId, person.ownerId);
        await authorizeGame(game, person);
        if (!game.completed) throw new ApiError(409, "まず3つのシーンを体験してください。");
        const result = state.requests.get(game.id) ?? await sendDateRequest(person, game.matchId, game.id);
        state.requests.set(game.id, result);
        return { requestId: result.id, demo: result.demo, status: "pending", message: result.demo ? "デモ申請を作成しました。実際の相手には送信されません。" : "デート申請を送りました。双方の承認まで連絡先は公開されません。" };
      });
    }
    default: throw new ApiError(404, "APIが見つかりません。");
  }
}
export async function GET(request: NextRequest) {
  if (request.nextUrl.pathname !== "/api/config") return json({ error: "Not found" }, 404);
  try { return json({ demoMode: isDemo(), llmMode: llmMode(), provider: llmMode() === "openai" ? "OpenAI API" : "ローカルの定型応答（LLM未使用）" }); }
  catch { return json({ error: "サーバーのAI設定を確認してください。" }, 503); }
}
export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const body = await readBody(request);
    const path = request.nextUrl.pathname.replace(/^\/api\//, "");
    if (path === "session") {
      const input = z.object({ adultConfirmed: z.literal(true), assertion: z.string().max(2000).optional() }).strict().parse(body);
      const session = createIdentity(request, input.assertion);
      const response = json({ ready: true, demoMode: isDemo(), llmMode: llmMode() });
      setIdentityCookie(response, session.token, request);
      return response;
    }
    const person = identity(request);
    return json(await dispatch(path, body, person));
  } catch (error) {
    if (error instanceof ApiError) return json({ error: error.message }, error.status);
    if (error instanceof z.ZodError) return json({ error: "入力内容を確認してください。未承認・不足・長すぎる項目があります。" }, 400);
    return json({ error: "処理を完了できませんでした。時間をおいて再試行してください。" }, 500);
  }
}
