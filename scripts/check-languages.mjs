import assert from "node:assert/strict";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const japanese = /[\u3040-\u30ff\u3400-\u9fff]/;
let cookie = "";
async function api(path, body, locale = "en", expected = 200) {
  const response = await fetch(`${base}/api/${path}`, { method: "POST", headers: { "Content-Type": "application/json", Origin: base, "X-Masala-Language": locale, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body), signal: AbortSignal.timeout(65000) });
  if (response.headers.get("set-cookie")) cookie = response.headers.get("set-cookie").split(";")[0];
  const data = await response.json();
  assert.equal(response.status, expected, `${path}: ${data.error || response.status}`);
  return data;
}
await api("session", { adultConfirmed: true });
const error = await api("interview/next", {}, "en", 400);
assert(!japanese.test(error.error));
const fallback = await api("interview/next", {}, "unsupported-language", 400);
assert(japanese.test(fallback.error));
const answers = [
  { question: "How do you meet people?", summary: "I am a fictional adult for this test. I prefer a quiet cafe and ask gentle questions." },
  { question: "How do you disagree?", summary: "I explain my preference calmly, then ask about their reasons." },
];
const next = await api("interview/next", { answers, skipped: 0, sendApproved: true });
assert(!japanese.test(next.question));
const draft = await api("persona/extract", { answers, sendApproved: true });
assert(!japanese.test(JSON.stringify(draft.content)));
const trial = await api("persona/calibrate", { draftId: draft.draftId, scenario: 0 });
assert(!japanese.test(trial.dialogue));
const revised = await api("persona/revise", { draftId: draft.draftId, feedback: "I prefer quiet cafes, and I want my responses to be short and gentle.", sendApproved: true });
assert(!japanese.test(JSON.stringify(revised.content)));
const approved = await api("persona/approve", { draftId: revised.draftId, adultConfirmed: true, simulationApproved: true, examplesApproved: true });
let game = await api("game/start", { matchId: "demo-match", agentPersonaId: approved.personaId });
let firstReply;
for (let i = 0; i < 9; i++) {
  const locale = i === 1 ? "ja" : "en";
  const response = await api("game/message", { gameId: game.id, message: i === 0 ? "I love exploring little bookshops on trips. What about you?" : "I would like to hear your thoughts. What matters to you?" }, locale);
  const dialogue = response.reply.dialogue;
  assert.equal(japanese.test(dialogue), locale === "ja", `Unexpected reply language at turn ${i + 1}`);
  if (i === 0) firstReply = dialogue;
  else assert.equal(response.game.messages[1].text, firstReply, "Changing language must not rewrite prior dialogue");
  assert(!("personaId" in response.game));
  game = response.game;
  if (i === 2 || i === 5 || i === 8) console.log(`PASS languages: scene ${Math.floor(i / 3) + 1}`);
}
assert.equal(game.completed, true);
const date = await api("date-request", { gameId: game.id });
assert(!japanese.test(date.message));
assert.equal(date.demo, true);
console.log("PASS languages: English interview, calibration, revision, 3 scenes and request; JA/EN switch preserves history; localized API errors");
