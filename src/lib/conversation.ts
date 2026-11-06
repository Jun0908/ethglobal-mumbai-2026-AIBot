import { z } from "zod";
import type { Locale } from "./i18n";
import { newRainStory, type RainStory } from "./rain-story";
import type { Dialogue } from "./schemas";
import type { Reflection } from "./reflection";

export const MAX_CONVERSATION_TURNS = 60;
export const dimensionIds = ["pace", "activities", "closeness", "differences"] as const;
export type DimensionId = typeof dimensionIds[number];
export type ConversationMessage = {
  id: string; role: "user" | "assistant"; text: string; locale: Locale;
  kind: "free_text" | "suggested_reply" | "story_action" | "agent_reply";
  sceneNode: RainStory["node"]; sequence: number;
};
export const feelingSchema = z.object({
  comfort: z.enum(["natural", "effort", "unsure"]).nullable(),
  again: z.enum(["yes", "no", "unsure"]).nullable(),
});
export type Feelings = z.infer<typeof feelingSchema>;
export type Suggestions = { locale: Locale; revision: number; items: { id: string; text: string }[] };
export type Conversation = {
  id: string; ownerId: string; personaId: string; personaVersion: number; matchId: string;
  partnerRef: string; partnerName: string; createdAt: number; updatedAt: number; expiresAt: number;
  revision: number; story: RainStory; messages: ConversationMessage[]; emotion: Dialogue["emotion"];
  suggestions: Suggestions; feelings: Feelings; reports: Reflection[]; dismissed: string[];
  request: { id: string; demo: boolean } | null;
  receipts: Record<string, { fingerprint: string; revision: number }>;
};
export function initialSuggestions(locale: Locale, revision = 0): Suggestions {
  const texts = locale === "en"
    ? ["I like taking my time in a quiet place. How about you?", "A little adventure sounds fun to me. What do you enjoy?", "What helps you feel comfortable with someone new?"]
    : ["私は静かな場所でゆっくり過ごすのが好き。あなたは？", "私はちょっとした冒険も楽しそうだと思う。あなたは何が好き？", "初対面の人と、どんなときに打ち解ける？"];
  return { locale, revision, items: texts.map((text, i) => ({ id: `${revision}-${locale}-${i}`, text })) };
}
export function createConversation(input: Pick<Conversation, "id" | "ownerId" | "personaId" | "personaVersion" | "matchId" | "partnerRef" | "partnerName">, locale: Locale, expiresAt: number): Conversation {
  return { ...input, createdAt: Date.now(), updatedAt: Date.now(), expiresAt, revision: 0, story: newRainStory(), messages: [], emotion: "neutral", suggestions: initialSuggestions(locale), feelings: { comfort: null, again: null }, reports: [], dismissed: [], request: null, receipts: {} };
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
  next.suggestions = { locale, revision: next.revision, items: reply.suggestions.slice(0, 3).map((value, i) => ({ id: `${next.revision}-${locale}-${i}`, text: value })) };
  return next;
}
export function publicConversation(c: Conversation) {
  return { id: c.id, partnerRef: c.partnerRef.startsWith("demo-") ? c.partnerRef : "match", partnerName: c.partnerName, createdAt: c.createdAt, updatedAt: c.updatedAt, expiresAt: c.expiresAt, revision: c.revision, story: c.story, messages: c.messages, emotion: c.emotion, suggestions: c.suggestions, feelings: c.feelings, reports: c.reports, dismissed: c.dismissed, requested: !!c.request, turnLimit: MAX_CONVERSATION_TURNS };
}
export type PublicConversation = ReturnType<typeof publicConversation>;
export function conversationSummary(c: Conversation, locale: Locale) {
  const report = c.reports.filter(r => r.locale === locale).at(-1);
  return { id: c.id, partnerRef: c.partnerRef.startsWith("demo-") ? c.partnerRef : "match", partnerName: c.partnerName, updatedAt: c.updatedAt, revision: c.revision, turns: c.messages.filter(m => m.kind !== "story_action" && m.role === "user").length, storyCompleted: c.story.node === "ending", feelings: c.feelings, report: report ?? null, dismissed: c.dismissed };
}
export type ConversationSummary = ReturnType<typeof conversationSummary>;
