import { test } from "node:test";
import assert from "node:assert/strict";
import { chooseStory, newRainStory, rainStory, storyChoices, storyContext } from "../src/lib/rain-story";
import { advanceGame, publicGame, retryGame, type Game } from "../src/lib/game";
import type { Dialogue } from "../src/lib/schemas";

test("all 27 routes reach an ending in exactly three decisions with distinct memories", () => {
  const routes = new Set<string>();
  for (const first of rainStory.rain.choices) {
    const one = chooseStory(newRainStory(), first.id);
    assert.equal(one.node, first.next);
    for (const second of rainStory[one.node].choices) {
      const two = chooseStory(one, second.id);
      assert.equal(two.node, "plan");
      for (const final of rainStory.plan.choices) {
        const end = chooseStory(two, final.id);
        assert.equal(end.node, "ending");
        assert.equal(end.revision, 3);
        const history = storyChoices(end);
        assert.equal(history[1].result.en, second.result.en);
        assert.equal(history[2].id, final.id);
        routes.add(JSON.stringify(end.choices));
        assert.throws(() => chooseStory(end, "stay"));
        assert(!/[\u3040-\u30ff\u3400-\u9fff]/.test(JSON.stringify(storyContext(end, "en"))));
      }
    }
  }
  assert.equal(routes.size, 27);
  assert.throws(() => chooseStory(newRainStory(), "bookshop"));
  assert.throws(() => chooseStory(newRainStory(), "__proto__"));
});

test("optional chat does not consume decisions; restart invalidates old action revisions", () => {
  const game: Game = { id: "test", ownerId: "private-owner", personaId: "private-persona", personaVersion: 1, matchId: "private-match", scene: 1, sceneTurns: 0, completed: false, messages: [], checkpoint: 0, emotion: "neutral", event: "rain", expiresAt: Date.now() + 10000, story: chooseStory(newRainStory(), "explore") };
  const reply: Dialogue = { dialogue: "Hello", emotion: "happy", tone: "warm", conversationEvent: "rain", suggestedNextAction: "continue" };
  let next = game;
  for (let i = 0; i < 12; i++) next = advanceGame(next, "An optional message", reply);
  assert.deepEqual(next.story, game.story);
  assert.equal(next.completed, false);
  const restarted = retryGame(next);
  assert.equal(restarted.story?.node, "rain");
  assert.equal(restarted.story?.revision, 2);
  assert.equal(restarted.messages.length, 0);
  assert.equal(next.messages.length, 24);
  assert(!JSON.stringify(publicGame(next)).includes("private-"));
});
