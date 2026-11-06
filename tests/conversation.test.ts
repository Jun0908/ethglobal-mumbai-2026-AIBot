import { test } from "node:test";
import assert from "node:assert/strict";
import { appendConversation, createConversation, publicConversation, switchSuggestionLanguage, type ConversationMessage } from "../src/lib/conversation";
import { validateReflection, type ReflectionCandidate } from "../src/lib/reflection";
import { chooseStory } from "../src/lib/rain-story";

test("conversation continues after the ending and keeps stable, typed evidence IDs", () => {
  let c = createConversation({ id: "test", ownerId: "private-owner", personaId: "private-persona", personaVersion: 1, matchId: "private-match", partnerRef: "demo-calm", partnerName: "Asha" }, "ja", Date.now() + 1000);
  c.story = chooseStory(chooseStory(chooseStory(c.story, "stay"), "blend"), "bookshop");
  c = appendConversation(c, "もっと話したい", "free_text", { dialogue: "いいね", emotion: "happy", tone: "warm", conversationEvent: "connection", suggestedNextAction: "continue", suggestions: ["ありがとう"] }, "ja");
  const prior = structuredClone(c);
  c = appendConversation(c, "次は英語で", "free_text", { dialogue: "Let's keep talking.", emotion: "happy", tone: "warm", conversationEvent: "connection", suggestedNextAction: "continue", suggestions: ["Tell me more"] }, "en");
  assert.equal(c.story.node, "ending");
  assert.deepEqual(c.messages.slice(0, 2), prior.messages);
  assert.equal(new Set(c.messages.map(m => m.id)).size, 4);
  assert.equal(c.suggestions.revision, 2);
  assert(!JSON.stringify(publicConversation(c)).includes("private-"));
  assert(!("receipts" in publicConversation(c)));
});

test("switching language back does not reuse stale suggestion IDs or translate history", () => {
  const c = createConversation({ id: "test", ownerId: "private-owner", personaId: "private-persona", personaVersion: 1, matchId: "private-match", partnerRef: "private-partner", partnerName: "Match" }, "ja", Date.now() + 1000);
  const ids = c.suggestions.items.map(s => s.id);
  switchSuggestionLanguage(c, "en");
  assert.equal(c.suggestions.locale, "en");
  switchSuggestionLanguage(c, "ja");
  assert(c.suggestions.items.every(s => !ids.includes(s.id)));
  assert.equal(c.revision, 0);
  assert(!JSON.stringify(publicConversation(c)).includes("private-"));
});

function message(id: string, role: "user" | "assistant", text: string, sequence: number, kind: ConversationMessage["kind"] = role === "user" ? "free_text" : "agent_reply"): ConversationMessage {
  return { id, role, text, sequence, kind, locale: "en", sceneNode: "rain" };
}
const messages = [message("a", "user", "I like quiet places.", 0), message("b", "assistant", "I like quiet places too.", 1)];
const candidate: ReflectionCandidate = { dimensions: [{ dimension: "activities", observation: "aligned", interpretation: "Both described quiet places.", unknowns: "Other situations remain unknown.", evidence: [{ messageId: "a", quote: "quiet places", purpose: "preference" }, { messageId: "b", quote: "quiet places too", purpose: "preference" }] }] };
test("reflection quotes must come from this conversation and both speakers", () => {
  const valid = validateReflection(candidate, messages, "en");
  assert.equal(valid[1].observation, "aligned");
  assert.equal(valid[1].evidence[0].start, 7);
  assert.equal(valid.filter(d => d.observation === "unknown").length, 3);
  for (const invalid of [
    [{ ...messages[0], id: "other-session" }, messages[1]],
    [{ ...messages[0], text: "I prefer crowds" }, messages[1]],
    [{ ...messages[0], kind: "story_action" as const }, messages[1]],
    [{ ...messages[0], role: "assistant" as const }, messages[1]],
  ]) assert.equal(validateReflection(candidate, invalid, "en")[1].observation, "unknown");
  assert.equal(validateReflection({ dimensions: [...candidate.dimensions, ...candidate.dimensions] }, messages, "en")[1].observation, "unknown");
});
test("adaptation requires a difference, later proposal and acceptance by the other speaker", () => {
  const m = [message("a", "user", "I prefer quiet.", 0), message("b", "assistant", "I prefer crowds.", 1), message("c", "user", "Could we try a quiet market?", 2), message("d", "assistant", "Yes, a quiet market works for me.", 3)];
  const c: ReflectionCandidate = { dimensions: [{ dimension: "differences", observation: "adapted", interpretation: "They found a compromise in this exchange.", unknowns: "Only one situation.", evidence: [{ messageId: "b", quote: "I prefer crowds.", purpose: "difference" }, { messageId: "c", quote: "Could we try a quiet market?", purpose: "proposal" }, { messageId: "d", quote: "Yes, a quiet market works for me.", purpose: "acceptance" }] }] };
  assert.equal(validateReflection(c, m, "en")[3].observation, "adapted");
  assert.equal(validateReflection(c, m.slice(0, 3), "en")[3].observation, "unknown");
  assert.equal(validateReflection(c, m.map(item => item.id === "d" ? { ...item, sequence: 0 } : item), "en")[3].observation, "unknown");
});
