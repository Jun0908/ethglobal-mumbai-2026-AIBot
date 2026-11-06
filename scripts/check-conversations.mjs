import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const live = process.env.TEST_LIVE === "1";
function client() {
  let cookie = "";
  return async (path, body, locale = "ja", expected = 200) => {
    const response = await fetch(`${base}/api/${path}`, { method: "POST", headers: { Origin: base, "Content-Type": "application/json", Cookie: cookie, "X-Masala-Language": locale }, body: JSON.stringify(body), signal: AbortSignal.timeout(65000) });
    if (response.headers.get("set-cookie")) cookie = response.headers.get("set-cookie").split(";")[0];
    assert.equal(response.status, expected, `${path}: HTTP ${response.status}`);
    return response.json();
  };
}
const post = client(), other = client();
await post("session", { adultConfirmed: true }); await other("session", { adultConfirmed: true });
const start = (agentPersonaId, fresh = false) => post("dialogue/start", { agentPersonaId, matchId: "demo-match", fresh });
let a = await start("demo-calm");
const empty = await post("dialogue/reflection", { gameId: a.id });
assert(empty.dimensions.every(d => d.observation === "unknown"));
await other("dialogue/get", { gameId: a.id }, "en", 404);
assert.equal((await other("dialogue/list", {})).conversations.length, 0);
await post("dialogue/date", { gameId: a.id }, "en", 409);
const body = { gameId: a.id, revision: a.revision, clientTurnId: randomUUID(), message: "私は静かな場所が好きです。初対面はゆっくり話したい。あなたはどう？" };
a = await post("dialogue/message", body);
assert.equal(a.suggestions.items.length, 3);
assert(/[\u3040-\u30ff]/.test(a.messages.at(-1).text));
assert.equal((await post("dialogue/message", body)).revision, a.revision);
await post("dialogue/message", { ...body, message: "changed" }, "ja", 409);
await post("dialogue/message", { ...body, clientTurnId: randomUUID() }, "ja", 409);
assert.equal(a.messages.length, 3);
const saved = structuredClone(a.messages);
let b = await start("demo-playful");
assert.notEqual(a.id, b.id);
b = await post("dialogue/message", { gameId: b.id, revision: 0, clientTurnId: randomUUID(), message: "I prefer quiet cafes, but I would be happy to try a small adventure. What do you enjoy?" }, "en");
assert(!/[\u3040-\u30ff]/.test(b.messages.at(-1).text));
const resumed = await start("demo-calm");
assert.equal(resumed.id, a.id); assert.deepEqual(resumed.messages, saved);
a = await post("dialogue/get", { gameId: a.id }, "en");
assert.equal(a.suggestions.locale, "en");
assert.deepEqual(a.messages, saved);
a = await post("dialogue/message", { gameId: a.id, revision: a.revision, clientTurnId: randomUUID(), suggestionId: a.suggestions.items[0].id }, "en");
assert.equal(a.messages.at(-2).kind, "suggested_reply");
assert.equal(a.story.node, "rain");
const reflection = await post("dialogue/reflection", { gameId: a.id }, "en");
assert.equal(reflection.dimensions.length, 4);
for (const dimension of reflection.dimensions) for (const evidence of dimension.evidence) {
  const source = a.messages.find(m => m.id === evidence.messageId);
  assert(source); assert.equal(source.text.slice(evidence.start, evidence.end), evidence.quote);
}
assert.deepEqual(await post("dialogue/reflection", { gameId: a.id }, "en"), reflection);
if (live) {
  // A factual quality assertion, not an exact generated wording or numeric score.
  assert(reflection.dimensions.some(d => d.evidence.length >= 2), "Live reflection should cite this explicit exchange");
  console.log("PASS live: Asha / Mira, Japanese / English, preserved history, replay and cited reflection");
} else {
  for (const choiceId of ["stay", "blend", "bookshop"]) a = await post("dialogue/action", { gameId: a.id, revision: a.revision, clientTurnId: randomUUID(), choiceId });
  assert.equal(a.story.node, "ending");
  a = await post("dialogue/date", { gameId: a.id }); assert.equal(a.requested, true);
  a = await post("dialogue/message", { gameId: a.id, revision: a.revision, clientTurnId: randomUUID(), message: "物語は終わったけど、まだ話したい。" });
  assert.equal(a.story.node, "ending"); assert.equal(a.requested, true);
  await post("dialogue/action", { gameId: a.id, revision: a.revision, clientTurnId: randomUUID(), choiceId: "stay" }, "en", 400);
  a = await post("dialogue/feedback", { gameId: a.id, feelings: { comfort: "natural", again: "yes" }, dismiss: { reportId: reflection.id, dimension: "pace", dismissed: true } });
  assert.equal(a.feelings.comfort, "natural"); assert(a.dismissed.includes(`${reflection.id}:pace`));
  await other("dialogue/reflection", { gameId: a.id }, "en", 404);
  await other("dialogue/feedback", { gameId: a.id, feelings: { comfort: "effort", again: "no" } }, "en", 404);
  const fresh = await start("demo-calm", true); assert.notEqual(fresh.id, a.id); assert.equal(fresh.messages.length, 1);
  assert.equal((await post("dialogue/get", { gameId: a.id })).messages.length, a.messages.length);
  assert.equal((await post("dialogue/list", {}, "en")).conversations.length, 3);
  const draft = await post("persona/extract", { answers: [{ question: "How do you talk?", summary: "I enjoy slow conversations." }], sendApproved: true });
  const persona = await post("persona/approve", { draftId: draft.draftId, simulationApproved: true, examplesApproved: true, adultConfirmed: true });
  const privateGame = await start(persona.personaId);
  await post("persona/revoke", { personaId: persona.personaId });
  await post("dialogue/get", { gameId: privateGame.id }, "en", 403);
  await post("dialogue/reflection", { gameId: privateGame.id }, "en", 403);
  assert(!(await post("dialogue/list", {})).conversations.some(c => c.id === privateGame.id));
  console.log("PASS demo: story ending with continued chat, idempotency, ownership, consent withdrawal, independent sessions, feedback, fresh date and comparison");
}
for (const value of [a, b, reflection]) for (const secret of ["ownerId", "personaId", "personaVersion", "matchId", "receipts", "behaviorExamples"]) assert(!JSON.stringify(value).includes(`"${secret}"`));
