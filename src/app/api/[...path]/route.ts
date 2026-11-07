import { photoPersona,photoSettingsSchema } from "@/lib/photo-persona";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { answerSchema, approvedAnswersSchema, idSchema, scenarios } from "@/lib/schemas";
import { advanceGame, publicGame, retryGame, type Game } from "@/lib/game";
import { isDemo, llmMode } from "@/lib/server/config";
import { createDraft, deleteDateRequest, deleteDraft, deleteOwnerDrafts, loadCapsule, loadDateRequest, loadDraft, loadGame, saveCapsule, saveDateRequest, saveDraft, saveGame, type Capsule, type Identity } from "@/lib/server/store";
import { ApiError, checkOrigin, createIdentity, ensureNoPrivateText, identity, locked, persistIdentity, readBody, setIdentityCookie } from "@/lib/server/security";
import { agentReply, extractPersona, nextQuestion, revisePersona } from "@/lib/server/llm";
import { demoPersona } from "@/lib/server/demo";
import { sendDateRequest, verifyMatch } from "@/lib/server/matching";
import { readLocale, translate, type Locale } from "@/lib/i18n";
import { interviewProgress } from "@/lib/interview";
import { chooseStory, newRainStory, rainStory, storyContext, storyText } from "@/lib/rain-story";
import { dispatchConversation } from "@/lib/server/conversation-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
async function draftFor(id: string, ownerId: string) {
  const draft = await loadDraft(id);
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
async function ownedGame(id: string, ownerId: string) {
  const game = await loadGame(id);
  if (!game || game.ownerId !== ownerId || game.expiresAt < Date.now()) throw new ApiError(404, "ゲームが見つかりません。");
  return game;
}
async function dispatch(path: string, body: unknown, person: Identity, locale: Locale, request: NextRequest) {
  if (path.startsWith("dialogue/")) return dispatchConversation(path, body, person, locale);
  switch (path) {
    case "interview/next": {
      const input = z.object({ answers: z.array(answerSchema).max(12), skipped: z.number().int().min(0).max(12), sendApproved: z.literal(true) }).strict().parse(body);
      ensureNoPrivateText(input.answers);
      if (interviewProgress(input.answers.length, input.skipped).finished) return { completed: true, question: null };
      return { ...await nextQuestion(input.answers, input.skipped, locale), completed: false };
    }
    case "persona/photos/get": {
      const input=z.object({personaId:z.string().uuid()}).strict().parse(body);
      const capsule=await capsuleFor(input.personaId);
      if(capsule.ownerId!==person.ownerId||!capsule.consent.simulationApproved)throw new ApiError(403,"Persona unavailable");
      return {visual:capsule.visual??null};
    }
    case "persona/photos": {
      const input=photoSettingsSchema.parse(body);
      const draft=await createDraft(person.ownerId,photoPersona(input.choices,input.voice,locale,input.personality));
      draft.visual=input;
      await saveDraft(draft);
      return {draftId:draft.id,content:draft.content};
    }
    case "persona/preview": {
      const input=z.object({draftId:idSchema,message:z.string().trim().min(1).max(1200)}).strict().parse(body);
      const draft=await draftFor(input.draftId,person.ownerId);
      const reply=await agentReply(draft.content,input.message,0,[],locale);
      draft.content.behaviorExamples=[...draft.content.behaviorExamples.slice(0,7),{situation:input.message.slice(0,300),response:reply.dialogue.slice(0,500),tendency:locale==='ja'?'本人が確認するプレビュー':'Preview for owner approval'}];
      await saveDraft(draft);
      return reply;
    }
    case "persona/extract": {
      const input = approvedAnswersSchema.parse(body);
      ensureNoPrivateText(input.answers);
      const content = await extractPersona(input.answers, locale);
      const draft = await createDraft(person.ownerId, content);
      return { draftId: draft.id, content: draft.content };
    }
    case "persona/calibrate": {
      const input = z.object({ draftId: idSchema, scenario: z.number().int().min(0).max(2) }).strict().parse(body);
      const draft = await draftFor(input.draftId, person.ownerId);
      return agentReply(draft.content, translate(locale, scenarios[input.scenario]), 0, [], locale);
    }
    case "persona/revise": {
      const input = z.object({ draftId: idSchema, feedback: z.string().min(1).max(1200), sendApproved: z.literal(true) }).strict().parse(body);
      const current = await draftFor(input.draftId, person.ownerId);
      ensureNoPrivateText(input.feedback);
      const proposal = await createDraft(person.ownerId, await revisePersona(current.content, input.feedback, locale));
      return { draftId: proposal.id, content: proposal.content };
    }
    case "persona/approve": {
      const input = z.object({ personaId:z.string().uuid().optional(), draftId: idSchema, simulationApproved: z.literal(true), examplesApproved: z.literal(true), adultConfirmed: z.literal(true) }).strict().parse(body);
      return locked(`draft:${input.draftId}`, async () => {
        const draft = await draftFor(input.draftId, person.ownerId);
        ensureNoPrivateText(draft.content);
        const previous=input.personaId?await capsuleFor(input.personaId):null;
        if(previous&&previous.ownerId!==person.ownerId)throw new ApiError(403,"Persona unavailable");
        const capsule: Capsule = { visual:draft.visual, personaId: previous?.personaId??randomUUID(), ownerId: person.ownerId, version: (previous?.version??0)+1, content: draft.content, boundaries: { revealPrivateInformation: false, allowSensitiveQuestions: false }, consent: { simulationApproved: true, approvedAt: new Date().toISOString() } };
        await saveCapsule(capsule);
        person.personaIds = [capsule.personaId, ...(person.personaIds ?? []).filter(id=>id!==capsule.personaId)];
        await persistIdentity(request, person);
        await deleteDraft(draft.id);
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
        person.personaIds = (person.personaIds ?? []).filter(id => id !== capsule.personaId);
        await persistIdentity(request, person);
        await deleteOwnerDrafts(person.ownerId);
        return { revoked: true };
      });
    }
    case "game/start": {
      const input = z.object({ matchId: idSchema, agentPersonaId: idSchema, simulationConsent: z.boolean().optional(), mode: z.literal("rain").optional() }).strict().parse(body);
      let personaId = input.agentPersonaId;
      if (isDemo() && ["demo-calm", "demo-playful"].includes(personaId)) {
        if (input.matchId !== "demo-match") throw new ApiError(403, "デモ用マッチを選んでください。");
        const capsule: Capsule = { personaId: randomUUID(), ownerId: person.ownerId, version: 1, content: demoPersona(personaId === "demo-calm" ? "calm" : "playful", locale), boundaries: { revealPrivateInformation: false, allowSensitiveQuestions: false }, consent: { simulationApproved: true, approvedAt: new Date().toISOString() } };
        await saveCapsule(capsule);
        personaId = capsule.personaId;
      }
      const capsule = await capsuleFor(personaId);
      if (!capsule.consent.simulationApproved || (isDemo() && capsule.ownerId !== person.ownerId)) throw new ApiError(403, "このPersonaの利用同意を確認できません。");
      await verifyMatch(person, input.matchId, personaId);
      const game: Game = { id: randomUUID(), ownerId: person.ownerId, personaId, personaVersion: capsule.version, matchId: input.matchId, scene: 0, sceneTurns: 0, completed: false, messages: [], checkpoint: 0, emotion: "neutral", event: "none", expiresAt: Date.now() + 2 * 60 * 60_000 };
      if (input.mode === "rain") { game.story = newRainStory(); game.scene = 1; game.event = "rain"; }
      await saveGame(game);
      return publicGame(game);
    }
    case "game/message": {
      const input = z.object({ gameId: idSchema, message: z.string().trim().min(1).max(1200) }).strict().parse(body);
      return locked(`game:${input.gameId}`, async () => {
        const current = await ownedGame(input.gameId, person.ownerId);
        if (current.completed) throw new ApiError(409, "この会話は終了しています。もう一度始めてください。");
        return locked(`persona:${current.personaId}`, async () => {
          const capsule = await authorizeGame(current, person);
          const reply = await agentReply(capsule.content, input.message, current.scene, current.messages, locale, current.story ? storyContext(current.story, locale) : undefined);
          await authorizeGame(current, person);
          const next = advanceGame(current, input.message, reply);
          await saveGame(next);
          return { game: publicGame(next), reply };
        });
      });
    }
    case "game/action": {
      const input = z.object({ gameId: idSchema, choiceId: idSchema, revision: z.number().int().min(0) }).strict().parse(body);
      return locked(`game:${input.gameId}`, async () => {
        const current = await ownedGame(input.gameId, person.ownerId);
        if (!current.story || current.completed || current.story.revision !== input.revision) throw new ApiError(409, "場面が変わりました。現在の選択肢から選んでください。");
        const choice = rainStory[current.story.node].choices.find(c => c.id === input.choiceId);
        if (!choice) throw new ApiError(400, "この場面では選べない行動です。");
        const nextStory = chooseStory(current.story, choice.id);
        return locked(`persona:${current.personaId}`, async () => {
          const capsule = await authorizeGame(current, person);
          const selected = storyText(choice.label, locale);
          const reply = await agentReply(capsule.content, selected, 1, current.messages, locale, storyContext(nextStory, locale));
          await authorizeGame(current, person);
          const next = advanceGame(current, selected, reply);
          next.story = nextStory;
          next.completed = nextStory.node === "ending";
          await saveGame(next);
          return { game: publicGame(next), reply };
        });
      });
    }
    case "game/retry": {
      const input = z.object({ gameId: idSchema }).strict().parse(body);
      return locked(`game:${input.gameId}`, async () => {
        const current = await ownedGame(input.gameId, person.ownerId);
        await authorizeGame(current, person);
        const next = retryGame(current);
        await saveGame(next);
        await deleteDateRequest(next.id);
        return publicGame(next);
      });
    }
    case "date-request": {
      const input = z.object({ gameId: idSchema }).strict().parse(body);
      return locked(`game:${input.gameId}`, async () => {
        const game = await ownedGame(input.gameId, person.ownerId);
        await authorizeGame(game, person);
        if (!game.completed) throw new ApiError(409, "まずデート体験を完了してください。");
        const result = await loadDateRequest(game.id) ?? await sendDateRequest(person, game.matchId, game.id);
        await saveDateRequest(game.id, result, game.expiresAt);
        return { requestId: result.id, demo: result.demo, status: "pending", message: translate(locale, result.demo ? "デモ申請を作成しました。実際の相手には送信されません。" : "デート申請を送りました。双方の承認まで連絡先は公開されません。") };
      });
    }
    default: throw new ApiError(404, "APIが見つかりません。");
  }
}
export async function GET(request: NextRequest) {
  const locale = readLocale(request.headers.get("x-masala-language"));
  if (request.nextUrl.pathname === "/api/session") {
    try { const person = await identity(request); return json({ ready: true, personaIds: person.personaIds ?? [] }); }
    catch { return json({ ready: false }, 401); }
  }
  if (request.nextUrl.pathname !== "/api/config") return json({ error: "Not found" }, 404);
  try { return json({ demoMode: isDemo(), llmMode: llmMode(), provider: llmMode() === "openai" ? "OpenAI API" : translate(locale, "ローカルの定型応答（LLM未使用）") }); }
  catch { return json({ error: translate(locale, "サーバーのAI設定を確認してください。") }, 503); }
}
export async function POST(request: NextRequest) {
  const locale = readLocale(request.headers.get("x-masala-language"));
  try {
    checkOrigin(request);
    const body = await readBody(request);
    const path = request.nextUrl.pathname.replace(/^\/api\//, "");
    if (path === "session") {
      const input = z.object({ adultConfirmed: z.literal(true), assertion: z.string().max(2000).optional() }).strict().parse(body);
      const session = await createIdentity(request, input.assertion);
      const response = json({ ready: true, demoMode: isDemo(), llmMode: llmMode() });
      setIdentityCookie(response, session.token, request);
      return response;
    }
    const person = await identity(request);
    return json(await dispatch(path, body, person, locale, request));
  } catch (error) {
    if (error instanceof ApiError) return json({ error: translate(locale, error.message) }, error.status);
    if (error instanceof z.ZodError) return json({ error: translate(locale, "入力内容を確認してください。未承認・不足・長すぎる項目があります。") }, 400);
    return json({ error: translate(locale, "処理を完了できませんでした。時間をおいて再試行してください。") }, 500);
  }
}
