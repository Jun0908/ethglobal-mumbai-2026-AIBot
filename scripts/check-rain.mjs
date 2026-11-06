import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
function client() {
  let cookie = "";
  return async (path, body, locale = "ja", status = 200) => {
    const response = await fetch(`${base}/api/${path}`, { method: "POST", headers: { "Content-Type": "application/json", Origin: base, Cookie: cookie, "X-Masala-Language": locale }, body: JSON.stringify(body), signal: AbortSignal.timeout(65000) });
    if (response.headers.get("set-cookie")) cookie = response.headers.get("set-cookie").split(";")[0];
    assert.equal(response.status, status, `${path}: HTTP ${response.status}`);
    return response.json();
  };
}
const stranger = client();
await stranger("session", { adultConfirmed: true });
const reactions = [];
for (const target of ["demo-calm", "demo-playful"]) {
  const post = client();
  await post("session", { adultConfirmed: true });
  let game = await post("game/start", { agentPersonaId: target, matchId: "demo-match", mode: "rain" });
  assert.equal(game.story.node, "rain");
  await stranger("game/action", { gameId: game.id, choiceId: "stay", revision: 0 }, "ja", 404);
  await post("date-request", { gameId: game.id }, "ja", 409);
  await post("game/action", { gameId: game.id, choiceId: "bookshop", revision: 0 }, "ja", 400);
  const path = target === "demo-calm" ? ["stay", "blend", "bookshop"] : ["explore", "postcard", "new-market"];
  for (let step = 0; step < path.length; step++) {
    const locale = step === 1 ? "en" : "ja";
    const result = await post("game/action", { gameId: game.id, choiceId: path[step], revision: game.story.revision }, locale);
    game = result.game;
    assert.equal(/[\u3040-\u30ff\u3400-\u9fff]/.test(result.reply.dialogue), locale === "ja");
    assert.equal(game.story.choices.length, step + 1);
    assert.equal(game.completed, step === 2);
    for (const key of ["ownerId", "personaId", "behaviorExamples", "personality", "consent", "personaVersion"]) assert(!JSON.stringify(result).includes(`"${key}"`));
    if (step === 0) {
      reactions.push(result.reply.dialogue);
      const oldMessages = structuredClone(game.messages);
      await post("game/action", { gameId: game.id, choiceId: path[0], revision: 0 }, "ja", 409);
      const chat = await post("game/message", { gameId: game.id, message: "I like green umbrellas. What do you think?" }, "en");
      assert.deepEqual(chat.game.story, game.story);
      assert.deepEqual(chat.game.messages.slice(0, oldMessages.length), oldMessages);
      assert(!/[\u3040-\u30ff\u3400-\u9fff]/.test(chat.reply.dialogue));
      game = chat.game;
    }
  }
  assert.equal(game.story.node, "ending");
  assert.deepEqual(game.story.choices, path);
  await post("game/action", { gameId: game.id, choiceId: "stay", revision: game.story.revision }, "ja", 409);
  const request = await post("date-request", { gameId: game.id });
  assert.equal(request.demo, true);
  assert.deepEqual(await post("date-request", { gameId: game.id }), request);
  const reset = await post("game/retry", { gameId: game.id });
  assert.equal(reset.story.node, "rain");
  assert.equal(reset.messages.length, 0);
  assert(reset.story.revision > game.story.revision);
  await post("game/action", { gameId: game.id, choiceId: "stay", revision: 0 }, "ja", 409);
  console.log(`PASS ${target}: branch → memory → ending; JA/EN switching, optional chat, ownership, stale actions, request and replay`);
}
assert.notEqual(reactions[0], reactions[1]);
