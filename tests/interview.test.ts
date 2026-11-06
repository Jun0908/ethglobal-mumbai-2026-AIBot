import { test } from "node:test";
import assert from "node:assert/strict";
import { interviewProgress } from "../src/lib/interview";

test("interview ends at six answers, skips, or a mix", () => {
  assert.deepEqual(interviewProgress(0, 0), { completed: 0, remaining: 6, finished: false });
  assert.equal(interviewProgress(5, 0).finished, false);
  for (let answered = 0; answered <= 6; answered++) {
    assert.deepEqual(interviewProgress(answered, 6 - answered), { completed: 6, remaining: 0, finished: true });
  }
  assert.equal(interviewProgress(12, 12).remaining, 0);
});
