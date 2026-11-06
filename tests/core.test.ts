import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { encrypt, decrypt } from "../src/lib/crypto";
import { advanceGame, retryGame, publicGame, type Game } from "../src/lib/game";
import { dialogueSchema } from "../src/lib/schemas";

test("capsule encryption uses fresh nonces and rejects tampering / wrong key", () => {
  const key = randomBytes(32);
  const original = { private: "sensitive persona" };
  const one = encrypt(original, key);
  const two = encrypt(original, key);
  assert.notEqual(one.iv, two.iv);
  assert(!JSON.stringify(one).includes(original.private));
  assert.deepEqual(decrypt(one, key), original);
  assert.throws(() => decrypt(one, randomBytes(32)));
  const bytes = Buffer.from(one.ciphertext, "base64"); bytes[0] ^= 1;
  assert.throws(() => decrypt({ ...one, ciphertext: bytes.toString("base64") }, key));
});
const reply = dialogueSchema.parse({ dialogue: "雨が降ってきたね。", emotion: "surprised", tone: "warm", conversationEvent: "rain", suggestedNextAction: "continue" });
function game(): Game { return { id: "game", ownerId: "owner-secret", personaId: "private-id", personaVersion: 1, matchId: "match", scene: 0, sceneTurns: 0, completed: false, messages: [], checkpoint: 0, emotion: "neutral", event: "none", expiresAt: Date.now() + 10000 }; }
test("scene transitions are controlled by the state machine, with a 9-turn ending", () => {
  let current = game();
  for (let i = 0; i < 9; i++) current = advanceGame(current, `turn ${i}`, reply);
  assert.equal(current.scene, 2);
  assert.equal(current.completed, true);
  assert.equal(current.messages.length, 18);
});
test("retry discards current-scene dialogue but retains earlier scene memories", () => {
  let current = game();
  for (let i = 0; i < 4; i++) current = advanceGame(current, `turn ${i}`, reply);
  const retried = retryGame(current);
  assert.equal(retried.scene, 1);
  assert.equal(retried.sceneTurns, 0);
  assert.equal(retried.messages.length, 6);
  assert.equal(current.messages.length, 8);
});
test("game DTO exposes no persona, owner, match or internal identifiers", () => {
  const dto = publicGame(game());
  assert(!("personaId" in dto)); assert(!("ownerId" in dto)); assert(!("matchId" in dto));
  assert(!JSON.stringify(dto).includes("private-id"));
});
test("invalid model emotions and extra-long output are rejected", () => {
  assert.equal(dialogueSchema.safeParse({ ...reply, emotion: "secret" }).success, false);
  assert.equal(dialogueSchema.safeParse({ ...reply, dialogue: "x".repeat(701) }).success, false);
});
