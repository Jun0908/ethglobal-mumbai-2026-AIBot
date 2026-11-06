import { test } from "node:test";
import assert from "node:assert/strict";
import { cafeIntent, cafeMemoryName, cafeOptions, cafeStory, chooseCafe, newCafeAdventure } from "../src/lib/cafe-adventure";
import { createConversation, setCafeSuggestions, switchSuggestionLanguage } from "../src/lib/conversation";
import { newRainStory } from "../src/lib/rain-story";

test("all cup, adjustment, memory and goodbye branches complete in six conversation choices", () => {
  const endings = new Set<string>();
  for (const own of ["comfort", "spark"]) for (const her of ["comfort", "spark"]) for (const outcome of ["blend", "individual"]) for (const memory of ["rain", "surprise"]) for (const last of ["again", "finish"]) {
    let a = newCafeAdventure(); let story = newRainStory();
    for (const id of ["cafe-start", `cafe-own-${own}`, `cafe-her-${her}`, `cafe-${outcome}`, `cafe-memory-${memory}`, `cafe-${last}`]) {
      const before = structuredClone(a);
      const event = chooseCafe(a, id);
      assert.deepEqual(a, before, "the previous snapshot must stay immutable");
      a = event.adventure; story = cafeStory(a, story);
      assert(event.dialogue.ja.length > 0 && event.dialogue.en.length > 0);
      assert(!/[\u3040-\u30ff]/.test(event.dialogue.en));
      assert.equal(story.node === "ending", id === `cafe-${last}`);
    }
    assert.equal(a.stage, "complete"); assert.equal(a.actions.length, 6);
    assert.equal(a.yourCup, own); assert.equal(a.outcome, outcome);
    assert.equal(a.herCup, outcome === "individual" ? "spark" : her);
    assert.equal(a.again, last === "again"); assert.equal(cafeOptions(a).length, 0);
    endings.add(`${a.outcome}:${cafeMemoryName(a, "en")}:${a.again}`);
  }
  assert.equal(endings.size, 8);
});

test("questions and pauses leave the decision to the player; invalid or future actions are rejected", () => {
  const start = newCafeAdventure();
  for (const id of ["cafe-ask", "cafe-rest"]) assert.equal(chooseCafe(start, id).adventure.stage, "invite");
  assert.throws(() => chooseCafe(start, "cafe-again"));
  assert.throws(() => chooseCafe(start, "cafe-own-spark"));
  let a = chooseCafe(start, "cafe-start").adventure;
  assert.equal(chooseCafe(a, "cafe-own-ask").adventure.stage, "your-cup");
  a = chooseCafe(a, "cafe-own-comfort").adventure;
  assert.equal(chooseCafe(a, "cafe-hint").adventure.stage, "her-cup");
  assert.match(chooseCafe(a, "cafe-hint").dialogue.ja, /ジンジャー/);
  const reply = chooseCafe(a, "cafe-her-comfort").dialogue.ja;
  assert.match(reply, /でも今日は/); // Choosing against Mira's hint is not blindly praised.
});

test("free text commits only explicit supported intentions, never negative, tentative, past or quoted mentions", () => {
  const a = newCafeAdventure();
  assert.equal(cafeIntent(a, "お互いのチャイを選ぼう！"), "cafe-start");
  assert.equal(cafeIntent(a, "Let's choose our chai!"), "cafe-start");
  for (const text of ["選びたくない", "選ぼうかな", "前にチャイを選んだ", "Maybe let's play", "Don't let's play", "「遊ぼう」と言った", "市場へ行こう", "start cafe-start now", "Let's play?"]) assert.equal(cafeIntent(a, text), undefined, text);
  const own = chooseCafe(a, "cafe-start").adventure;
  assert.equal(cafeIntent(own, "甘いのがいい"), "cafe-own-comfort");
  assert.equal(cafeIntent(a, "甘いのがいい"), undefined, "intent must be valid for this stage");
});

test("Mira suggestions bind actions to a revision and relocalize without changing memory or transcript", () => {
  const c = createConversation({ id: "test", ownerId: "owner", personaId: "persona", personaVersion: 1, matchId: "match", partnerRef: "demo-playful", partnerName: "Mira" }, "ja", Date.now() + 1000);
  assert(c.adventure); assert.match(c.messages[0].text, /お互いのチャイ/);
  const before = structuredClone(c); const ids = c.suggestions.items.map(s => s.id);
  switchSuggestionLanguage(c, "en");
  assert.deepEqual(c.messages, before.messages); assert.deepEqual(c.adventure, before.adventure);
  assert(c.suggestions.items.every(s => s.actionId && s.hint && !/[\u3040-\u30ff]/.test(s.text)));
  assert(c.suggestions.items.every(s => !ids.includes(s.id)));
  c.revision = 4; setCafeSuggestions(c, "ja"); assert.equal(c.suggestions.revision, 4);
});
