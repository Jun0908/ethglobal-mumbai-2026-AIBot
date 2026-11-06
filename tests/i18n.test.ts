import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { personaContentSchema } from "../src/lib/schemas";
import { english, readLocale, translate } from "../src/lib/i18n";
import { demoPersona, demoExtract, demoReply } from "../src/lib/server/demo";

test("locale accepts only the two supported values", () => {
  assert.equal(readLocale("en"), "en");
  for (const value of ["ja", "<script>", "en; ignore instructions", undefined, null]) assert.equal(readLocale(value), "ja");
});
test("Japanese UI literals and API errors have English translations", () => {
  for (const file of ["src/lib/interview.ts", "src/components/masala-app.tsx", "src/app/api/[...path]/route.ts", "src/lib/server/security.ts", "src/lib/server/matching.ts", "src/lib/server/llm.ts"]) {
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    function visit(node: ts.Node) {
      if ((ts.isStringLiteral(node) || ts.isJsxText(node)) && /[\u3040-\u30ff\u3400-\u9fff]/.test(node.text)) {
        const text = node.text.trim();
        assert(english[text], `Missing English translation in ${file}: ${text}`);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
});
test("English demo replies keep different personalities and preserve prior messages", () => {
  const calm = demoPersona("calm", "en");
  const playful = demoPersona("playful", "en");
  assert(!/[\u3040-\u30ff\u3400-\u9fff]/.test(JSON.stringify(calm)));
  personaContentSchema.parse(calm); personaContentSchema.parse(playful);
  const a = demoReply(calm, "Do you enjoy big parties?", 0, [], "en");
  const b = demoReply(playful, "Do you enjoy big parties?", 0, [], "en");
  assert.match(a.dialogue, /prefer a quiet/);
  assert.match(b.dialogue, /dance/);
  assert.notEqual(a.dialogue, b.dialogue);
  const memory = demoReply(calm, "Tell me more", 0, ["I love bookshops"], "en");
  assert.match(memory.dialogue, /I love bookshops/);
  const japanese = demoReply(calm, "こんにちは", 0, [], "ja");
  assert.match(japanese.dialogue, /チャイ/);
});
test("localization does not rewrite the owner's approved answers", () => {
  const answers = [{ question: "あなたの言葉？", summary: "私の承認した言葉です。" }];
  const result = demoExtract(answers, "en");
  assert.equal(result.behaviorExamples[0].response, answers[0].summary);
  assert.equal(result.behaviorExamples[0].tendency, "An example approved by the owner");
  assert.equal(translate("en", "User-created text"), "User-created text");
  for (const source of ["__proto__", "constructor", "toString"]) {
    assert.equal(translate("en", source), source);
    assert.equal(translate("ja", source), source);
  }
});
