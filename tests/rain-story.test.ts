import { test } from "node:test";
import assert from "node:assert/strict";
import { chooseStory, newRainStory, rainStory, storyChoices, storyContext } from "../src/lib/rain-story";
import { advanceGame, publicGame, retryGame, type Game } from "../src/lib/game";
import type { Dialogue } from "../src/lib/schemas";

test("all story paths finish, and guessing requires an answer before planning", () => {
  let count = 0;
  function walk(story: ReturnType<typeof newRainStory>) {
    if (story.node === "ending") {
      count++;
      assert.equal(storyChoices(story).length, story.choices.length);
      assert.throws(() => chooseStory(story, "stay"));
      return;
    }
    for (const choice of rainStory[story.node].choices) walk(chooseStory(story, choice.id));
  }
  walk(newRainStory());
  assert.equal(count, 33);
  const playing = chooseStory(chooseStory(newRainStory(), "stay"), "guess");
  assert.equal(playing.node, "guessing");
  assert.throws(() => chooseStory(playing, "bookshop"));
  assert(!JSON.stringify(playing).includes("cinnamon"));
  assert.equal(chooseStory(playing, "answer-ginger").node, "plan");
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
