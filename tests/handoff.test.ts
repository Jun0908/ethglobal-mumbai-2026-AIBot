import assert from "node:assert/strict";
import { test } from "node:test";
import { isAssertionMessage } from "../src/lib/handoff";

test("should accept only a bounded identity assertion message", () => {
  const valid = { type: "secret-tinder:assertion", version: 1, assertion: "abc.def" };
  assert.equal(isAssertionMessage(valid), true);
  assert.equal(isAssertionMessage({ ...valid, version: 2 }), false);
  assert.equal(isAssertionMessage({ ...valid, assertion: "abc.def?token=secret" }), false);
  assert.equal(isAssertionMessage({ ...valid, assertion: "a".repeat(2001) }), false);
  assert.equal(isAssertionMessage(null), false);
});
