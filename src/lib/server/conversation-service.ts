import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { idSchema } from "../schemas";
import { appendConversation, conversationSummary, createConversation, dimensionIds, feelingSchema, MAX_CONVERSATION_TURNS, publicConversation, switchSuggestionLanguage, type Conversation } from "../conversation";
import { chooseStory, rainStory, storyText } from "../rain-story";
import type { Locale } from "../i18n";
import { ApiError, locked } from "./security";
import { isDemo } from "./config";
import { loadCapsule, saveCapsule, state, type Identity } from "./store";
import { demoPersona } from "./demo";
import { sendDateRequest, verifyMatch } from "./matching";
import { conversationReply, generateReflection } from "./conversation-llm";

const idBody = z.object({ gameId: z.string().uuid() });
function fail(locale: Locale, status: number, ja: string, en: string): never { throw new ApiError(status, locale === "en" ? en : ja); }
function owned(id: string, person: Identity, locale: Locale) {
  const c = state.conversations.get(id);
  if (!c || c.ownerId !== person.ownerId || c.expiresAt <= Date.now()) return fail(locale, 404, "会話が見つかりません。期限内の会話を選んでください。", "Conversation not found. Choose an active conversation.");
  return c;
}
async function authorize(c: Conversation, person: Identity, locale: Locale) {
  owned(c.id, person, locale);
  const capsule = await loadCapsule(c.personaId).catch(() => fail(locale, 404, "相手のAIを利用できません。", "This AI is unavailable."));
  if (!capsule.consent.simulationApproved || capsule.version !== c.personaVersion || (isDemo() && capsule.ownerId !== person.ownerId)) return fail(locale, 403, "相手の利用同意が撤回・更新されました。", "The companion's consent has been withdrawn or updated.");
  await verifyMatch(person, c.matchId, c.personaId);
  return capsule;
}
function touch(c: Conversation, person: Identity) {
  c.expiresAt = Math.min(person.expiresAt, Date.now() + 2 * 60 * 60_000);
}

export async function dispatchConversation(path: string, body: unknown, person: Identity, locale: Locale) {
  if (path === "dialogue/start") {
    const input = z.object({ matchId: idSchema, agentPersonaId: idSchema, fresh: z.boolean().default(false) }).strict().parse(body);
    return locked(`conversation-start:${person.ownerId}`, async () => {
      const previous = [...state.conversations.values()].filter(c => c.ownerId === person.ownerId && c.partnerRef === input.agentPersonaId && c.matchId === input.matchId && c.expiresAt > Date.now()).sort((a, b) => b.updatedAt - a.updatedAt)[0];
      if (previous && !input.fresh) { await authorize(previous, person, locale); touch(previous, person); switchSuggestionLanguage(previous, locale); return publicConversation(previous); }
      if ([...state.conversations.values()].filter(c => c.ownerId === person.ownerId).length >= 20) return fail(locale, 429, "会話が20件あります。今ある会話の続きを楽しんでください。", "You have 20 conversations. Please continue an existing one.");
      let personaId = input.agentPersonaId;
      const demo = isDemo() && ["demo-calm", "demo-playful"].includes(personaId);
      if (demo) {
        if (input.matchId !== "demo-match") return fail(locale, 403, "デモ用の相手を選んでください。", "Choose a demo companion.");
        const capsule = { personaId: randomUUID(), ownerId: person.ownerId, version: 1, content: demoPersona(personaId === "demo-calm" ? "calm" : "playful", locale), boundaries: { revealPrivateInformation: false as const, allowSensitiveQuestions: false as const }, consent: { simulationApproved: true, approvedAt: new Date().toISOString() } };
        await saveCapsule(capsule); personaId = capsule.personaId;
      }
      const capsule = await loadCapsule(personaId).catch(() => fail(locale, 404, "相手のAIを利用できません。", "This AI is unavailable."));
      if (!capsule.consent.simulationApproved || (isDemo() && capsule.ownerId !== person.ownerId)) return fail(locale, 403, "相手の利用同意を確認できません。", "Could not verify consent for this companion.");
      await verifyMatch(person, input.matchId, personaId);
      const c = createConversation({ id: randomUUID(), ownerId: person.ownerId, personaId, personaVersion: capsule.version, matchId: input.matchId, partnerRef: input.agentPersonaId, partnerKey: previous?.partnerKey, partnerName: demo ? input.agentPersonaId === "demo-calm" ? "Asha" : "Mira" : "Your match" }, locale, Math.min(person.expiresAt, Date.now() + 2 * 60 * 60_000));
      state.conversations.set(c.id, c);
      return publicConversation(c);
    });
  }
  if (path === "dialogue/list") {
    z.object({}).strict().parse(body);
    const items = [];
    for (const c of state.conversations.values()) {
      if (c.ownerId !== person.ownerId || c.expiresAt <= Date.now()) continue;
      try { await authorize(c, person, locale); items.push(conversationSummary(c, locale)); }
      catch (e) { if (!(e instanceof ApiError) || ![403, 404].includes(e.status)) throw e; }
    }
    return { conversations: items.sort((a, b) => b.updatedAt - a.updatedAt) };
  }
  if (path === "dialogue/get") {
    const { gameId } = idBody.strict().parse(body);
    const c = owned(gameId, person, locale); await authorize(c, person, locale); touch(c, person); switchSuggestionLanguage(c, locale);
    return publicConversation(c);
  }
  if (path === "dialogue/reflection") {
    const { gameId } = idBody.strict().parse(body);
    const current = owned(gameId, person, locale); await authorize(current, person, locale);
    const snapshot = structuredClone(current);
    return locked(`reflection:${gameId}:${snapshot.revision}:${locale}`, async () => {
      const cached = current.reports.find(r => r.revision === snapshot.revision && r.locale === locale && r.version === 1);
      if (cached) return cached;
      const result = await generateReflection(gameId, snapshot.revision, snapshot.messages, locale);
      const latest = owned(gameId, person, locale); await authorize(latest, person, locale);
      latest.reports = [...latest.reports.filter(r => !(r.locale === locale && r.revision <= result.revision)), result].sort((a, b) => a.revision - b.revision).slice(-8);
      return result;
    });
  }
  if (path === "dialogue/feedback") {
    const input = idBody.extend({ feelings: feelingSchema.optional(), dismiss: z.object({ reportId: z.string().uuid(), dimension: z.enum(dimensionIds), dismissed: z.boolean() }).optional() }).strict().parse(body);
    return locked(`conversation:${input.gameId}`, async () => {
      const c = owned(input.gameId, person, locale); await authorize(c, person, locale);
      if (input.feelings) c.feelings = input.feelings;
      if (input.dismiss) {
        if (!c.reports.some(r => r.id === input.dismiss!.reportId)) return fail(locale, 409, "新しい振り返りを開いてください。", "Please open the current reflection.");
        const key = `${input.dismiss.reportId}:${input.dismiss.dimension}`;
        c.dismissed = c.dismissed.filter(value => value !== key);
        if (input.dismiss.dismissed) c.dismissed.push(key);
      }
      return publicConversation(c);
    });
  }
  if (path === "dialogue/date") {
    const { gameId } = idBody.strict().parse(body);
    return locked(`conversation:${gameId}`, async () => {
      const c = owned(gameId, person, locale); await authorize(c, person, locale);
      if (c.story.node !== "ending") return fail(locale, 409, "物語を終えてから申請できます。会話は続けられます。", "Finish the story before requesting a date. You can keep talking.");
      c.request ??= await sendDateRequest(person, c.matchId, c.id);
      return publicConversation(c);
    });
  }
  if (path === "dialogue/message" || path === "dialogue/action") {
    const input = idBody.extend({ revision: z.number().int().min(0), clientTurnId: z.string().uuid(), message: z.string().trim().min(1).max(1200).optional(), suggestionId: z.string().max(100).optional(), choiceId: z.string().max(100).optional() }).strict().parse(body);
    return locked(`conversation:${input.gameId}`, async () => {
      const c = owned(input.gameId, person, locale); const capsule = await authorize(c, person, locale);
      const fingerprint = JSON.stringify([path, input.revision, input.message, input.suggestionId, input.choiceId, locale]);
      const prior = c.receipts[input.clientTurnId];
      if (prior) {
        if (prior.fingerprint !== fingerprint) return fail(locale, 409, "同じ送信IDを別の内容には使えません。", "This turn ID was already used for different content.");
        return publicConversation(c);
      }
      if (input.revision !== c.revision) return fail(locale, 409, "会話が更新されています。相手一覧から続きを開き直してください。", "The conversation changed. Reopen it from the companion list.");
      if (c.messages.length >= MAX_CONVERSATION_TURNS * 2) return fail(locale, 409, "この会話は60往復になりました。振り返るか、新しいデートを始めてください。", "This conversation reached 60 exchanges. Reflect or start a new date.");
      let text: string; let kind: "story_action" | "free_text" | "suggested_reply"; let story = c.story;
      if (path === "dialogue/action") {
        const choice = rainStory[c.story.node].choices.find(choice => choice.id === input.choiceId);
        if (!choice || input.message || input.suggestionId) return fail(locale, 400, "今の場面の行動を選んでください。", "Choose an action for the current scene.");
        text = storyText(choice.label, locale); kind = "story_action"; story = chooseStory(c.story, choice.id);
      } else {
        if (input.choiceId || Number(!!input.message) + Number(!!input.suggestionId) !== 1) return fail(locale, 400, "返答候補か入力した文章を送ってください。", "Send either a suggested reply or your own message.");
        const suggestion = c.suggestions.items.find(s => s.id === input.suggestionId);
        if (input.suggestionId && (!suggestion || c.suggestions.revision !== c.revision || c.suggestions.locale !== locale)) return fail(locale, 409, "この候補は更新されています。自分の言葉で話すこともできます。", "This suggestion is outdated. You can write your own reply.");
        text = input.message || suggestion!.text; kind = input.suggestionId ? "suggested_reply" : "free_text";
      }
      const reply = await conversationReply(capsule.content, { ...c, story }, text, locale);
      await authorize(c, person, locale);
      const next = appendConversation(c, text, kind, reply, locale, story);
      // Analysis and feedback may have completed while the response was generating.
      next.reports = c.reports; next.dismissed = c.dismissed; next.feelings = c.feelings;
      next.receipts[input.clientTurnId] = { fingerprint, revision: next.revision };
      touch(next, person); state.conversations.set(next.id, next);
      return publicConversation(next);
    });
  }
  return fail(locale, 404, "操作が見つかりません。", "Action not found.");
}
