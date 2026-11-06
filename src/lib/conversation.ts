import { z } from "zod";
import type { Locale } from "./i18n";
import { newRainStory, type RainStory } from "./rain-story";
import type { Dialogue } from "./schemas";
import type { Reflection } from "./reflection";
import { cafeOpening, cafeOptions, newCafeAdventure, type CafeAdventure } from "./cafe-adventure";

export const MAX_CONVERSATION_TURNS = 60;
export const dimensionIds = ["pace", "activities", "closeness", "differences"] as const;
export type DimensionId = typeof dimensionIds[number];
export type ConversationMessage = {
  id: string; role: "user" | "assistant"; text: string; locale: Locale;
  kind: "free_text" | "suggested_reply" | "story_action" | "agent_reply" | "opening";
  sceneNode: RainStory["node"]; sequence: number;
};
export const feelingSchema = z.object({
  comfort: z.enum(["natural", "effort", "unsure"]).nullable(),
  again: z.enum(["yes", "no", "unsure"]).nullable(),
});
export type Feelings = z.infer<typeof feelingSchema>;
export type Suggestions = { locale: Locale; revision: number; items: { id: string; text: string; actionId?: string; hint?: string }[] };
export type Conversation = {
  id: string; ownerId: string; personaId: string; personaVersion: number; matchId: string;
  partnerRef: string; partnerName: string; partnerKey: string; createdAt: number; updatedAt: number; expiresAt: number;
  revision: number; story: RainStory; messages: ConversationMessage[]; emotion: Dialogue["emotion"];
  adventure?: CafeAdventure;
  suggestions: Suggestions; feelings: Feelings; reports: Reflection[]; dismissed: string[];
  request: { id: string; demo: boolean } | null;
  receipts: Record<string, { fingerprint: string; revision: number }>;
};
export function initialSuggestions(locale: Locale, revision = 0, playful = false): Suggestions {
  const texts = playful ? locale === "en" ? ["Let's play! You go first.", "I'd like to just enjoy my chai for a bit.", "What kind of game do you have in mind?"] : ["遊ぼう！ そっちから始めて。", "まずはチャイでひと休みしたいな。", "どんな遊びを考えてる？"] : locale === "en"
    ? ["I like taking my time in a quiet place. How about you?", "A little adventure sounds fun to me. What do you enjoy?", "What helps you feel comfortable with someone new?"]
    : ["私は静かな場所でゆっくり過ごすのが好き。あなたは？", "私はちょっとした冒険も楽しそうだと思う。あなたは何が好き？", "初対面の人と、どんなときに打ち解ける？"];
  const setId = crypto.randomUUID();
  return { locale, revision, items: texts.map((text, i) => ({ id: `${setId}-${i}`, text })) };
}
export function switchSuggestionLanguage(c: Conversation, locale: Locale, texts?: string[]) {
  if (c.adventure) { setCafeSuggestions(c, locale); return; }
  if (c.suggestions.locale === locale && !texts) return;
  const fallback = locale === "en" ? ["Thanks for listening.", "Let's change the topic.", "Let's pause a moment."] : ["聞いてくれてありがとう。", "話題を変えよう。", "少しひと休みしよう。"];
  const setId = crypto.randomUUID();
  c.suggestions = { locale, revision: c.revision, items: (texts ?? (c.revision === 0 ? initialSuggestions(locale, 0, c.partnerRef === "demo-playful").items.map(s => s.text) : fallback)).map((text, i) => ({ id: `${setId}-${i}`, text })) };
}
export function setCafeSuggestions(c: Conversation, locale: Locale) {
  if (!c.adventure) return;
  const setId = crypto.randomUUID();
  c.suggestions = { locale, revision: c.revision, items: cafeOptions(c.adventure).map((o, i) => ({ id: `${setId}-${i}`, text: o.label[locale], actionId: o.id, hint: o.hint[locale] })) };
}
export function createConversation(input: Pick<Conversation, "id" | "ownerId" | "personaId" | "personaVersion" | "matchId" | "partnerRef" | "partnerName"> & { partnerKey?: string }, locale: Locale, expiresAt: number): Conversation {
  const playful = input.partnerRef === "demo-playful";
  const opening = playful ? cafeOpening[locale] : locale === "en"
    ? playful ? "The rain has changed our plans! Want to invent a tiny cafe game, or just enjoy our chai?" : "We have a little extra time. I'll enjoy my chai slowly. No need to rush the conversation."
    : playful ? "雨で予定変更だね！ このカフェでできる小さな遊び、考えちゃおうか。それともチャイでひと休み？" : "少し時間ができたね。私はチャイをゆっくり味わおうかな。話すのも、急がなくていいよ。";
  const messages: ConversationMessage[] = [{ id: crypto.randomUUID(), role: "assistant", text: opening, kind: "opening", locale, sceneNode: "rain", sequence: 0 }];
  const c: Conversation = { ...input, partnerKey: input.partnerKey || crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now(), expiresAt, revision: 0, story: newRainStory(), messages, emotion: "neutral", suggestions: initialSuggestions(locale, 0, playful), feelings: { comfort: null, again: null }, reports: [], dismissed: [], request: null, receipts: {} };
  if (playful) { c.adventure = newCafeAdventure(); setCafeSuggestions(c, locale); }
  return c;
}
export function appendConversation(current: Conversation, text: string, kind: ConversationMessage["kind"], reply: Dialogue & { suggestions: string[] }, locale: Locale, story = current.story): Conversation {
  const next = structuredClone(current);
  next.revision++;
  next.story = story;
  next.updatedAt = Date.now();
  for (const [role, body, messageKind] of [["user", text, kind], ["assistant", reply.dialogue, "agent_reply"]] as const) {
    next.messages.push({ id: crypto.randomUUID(), role, text: body, kind: messageKind, locale, sceneNode: story.node, sequence: next.messages.length });
  }
  next.emotion = reply.emotion;
  const setId = crypto.randomUUID();
  next.suggestions = { locale, revision: next.revision, items: reply.suggestions.slice(0, 3).map((value, i) => ({ id: `${setId}-${i}`, text: value })) };
  return next;
}
export function publicConversation(c: Conversation) {
  return { id: c.id, partnerRef: c.partnerRef.startsWith("demo-") ? c.partnerRef : c.partnerKey, partnerName: c.partnerName, createdAt: c.createdAt, updatedAt: c.updatedAt, expiresAt: c.expiresAt, revision: c.revision, story: c.story, adventure: c.adventure, messages: c.messages, emotion: c.emotion, suggestions: c.suggestions, feelings: c.feelings, reports: c.reports, dismissed: c.dismissed, requested: !!c.request, turnLimit: MAX_CONVERSATION_TURNS };
}
export type PublicConversation = ReturnType<typeof publicConversation>;
export function conversationSummary(c: Conversation, locale: Locale) {
  const report = c.reports.filter(r => r.locale === locale).at(-1);
  return { id: c.id, partnerRef: c.partnerRef.startsWith("demo-") ? c.partnerRef : c.partnerKey, partnerName: c.partnerName, updatedAt: c.updatedAt, revision: c.revision, turns: c.messages.filter(m => m.kind !== "story_action" && m.role === "user").length, storyCompleted: c.story.node === "ending", feelings: c.feelings, report: report ?? null, dismissed: c.dismissed };
}
export type ConversationSummary = ReturnType<typeof conversationSummary>;
