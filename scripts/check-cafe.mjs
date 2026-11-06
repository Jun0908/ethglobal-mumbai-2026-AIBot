import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
function client() {
  let cookie = "";
  return async (path, body, locale = "ja", status = 200) => {
    const r = await fetch(`${base}/api/${path}`, { method: "POST", headers: { Origin: base, "Content-Type": "application/json", Cookie: cookie, "X-Masala-Language": locale }, body: JSON.stringify(body), signal: AbortSignal.timeout(65000) });
    if (r.headers.get("set-cookie")) cookie = r.headers.get("set-cookie").split(";")[0];
    const data = await r.json();
    assert.equal(r.status, status, `${path}: ${JSON.stringify(data)}`);
    return data;
  };
}
const post = client(), stranger = client();
await post("session", { adultConfirmed: true }); await stranger("session", { adultConfirmed: true });
async function start(locale) { return post("dialogue/start", { agentPersonaId: "demo-playful", matchId: "demo-match", fresh: true }, locale); }
async function choose(c, id, locale = "ja") {
  const s = c.suggestions.items.find(s => s.actionId === id); assert(s, `${id} available`);
  return post("dialogue/message", { gameId: c.id, revision: c.revision, clientTurnId: randomUUID(), suggestionId: s.id }, locale);
}
let c = await start("ja");
assert.equal(c.adventure.stage, "invite");
await stranger("dialogue/get", { gameId: c.id }, "en", 404);
await post("dialogue/action", { gameId: c.id, revision: c.revision, clientTurnId: randomUUID(), choiceId: "cafe-again" }, "ja", 400);
await post("dialogue/date", { gameId: c.id }, "en", 409);
const pause = { gameId: c.id, revision: c.revision, clientTurnId: randomUUID(), message: "静かにしたい" };
c = await post("dialogue/message", pause);
assert.equal(c.adventure.stage, "invite"); assert(!c.messages.at(-1).text.includes("？"));
assert.equal((await post("dialogue/message", pause)).revision, c.revision);
await post("dialogue/message", { ...pause, message: "違う内容" }, "ja", 409);
c = await choose(c, "cafe-start");
const explicit = { gameId: c.id, revision: c.revision, clientTurnId: randomUUID(), message: "甘いのがいい" };
c = await post("dialogue/message", explicit);
assert.equal(c.adventure.stage, "her-cup"); assert.equal(c.adventure.yourCup, "comfort");
assert.match(c.messages.at(-1).text, /ほっとする甘さ/);
const jp = c.suggestions.items[0]; const saved = structuredClone(c.messages);
c = await post("dialogue/get", { gameId: c.id }, "en");
assert.deepEqual(c.messages, saved); assert.equal(c.adventure.yourCup, "comfort");
assert(c.suggestions.items.every(s => !/[\u3040-\u30ff]/.test(s.text)));
await post("dialogue/message", { gameId: c.id, revision: c.revision, clientTurnId: randomUUID(), suggestionId: jp.id }, "ja", 409);
c = await choose(c, "cafe-her-comfort", "en");
assert.match(c.messages.at(-1).text, /still fancy trying ginger/);
c = await choose(c, "cafe-blend", "en");
c = await choose(c, "cafe-memory-rain", "en");
c = await choose(c, "cafe-again", "en");
assert.equal(c.adventure.stage, "complete"); assert.equal(c.story.node, "ending");
assert.match(c.messages.at(-1).text, /comforting sweetness/);
assert.equal(c.suggestions.items.length, 0);
const complete = structuredClone(c);
c = await post("dialogue/message", { gameId: c.id, revision: c.revision, clientTurnId: randomUUID(), message: "I liked how we blended the flavors. What did you think?" }, "en");
assert.equal(c.adventure.stage, "complete"); assert.equal(c.adventure.outcome, "blend");
assert(!/[\u3040-\u30ff]/.test(c.messages.at(-1).text));
assert.deepEqual(c.messages.slice(0, complete.messages.length), complete.messages);
const report = await post("dialogue/reflection", { gameId: c.id }, "en");
for (const d of report.dimensions) for (const e of d.evidence) {
  const source = c.messages.find(m => m.id === e.messageId); assert(source);
  assert.equal(source.text.slice(e.start, e.end), e.quote);
}
let separate = await start("en");
for (const id of ["cafe-start", "cafe-own-spark", "cafe-her-spark", "cafe-individual", "cafe-memory-surprise", "cafe-finish"]) separate = await choose(separate, id, "en");
assert.equal(separate.adventure.outcome, "individual"); assert.equal(separate.adventure.again, false);
assert.equal(separate.adventure.memory, "surprise"); assert.notEqual(separate.id, c.id);
assert.deepEqual((await post("dialogue/get", { gameId: c.id }, "en")).adventure, c.adventure);
console.log("PASS cafe API: both endings, six reply decisions, explicit free-text action, pause, language switch, stale/invalid/replayed turns, ownership, preserved history, post-ending chat and grounded reflection");
console.log(`Post-ending reply: ${c.messages.at(-1).text}`);
