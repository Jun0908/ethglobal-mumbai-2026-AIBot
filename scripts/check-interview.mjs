import assert from "node:assert/strict";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
for (const locale of ["ja", "en"]) {
  let cookie = "";
  async function post(path, body) {
    const response = await fetch(`${base}/api/${path}`, {
      method: "POST", headers: { "Content-Type": "application/json", Origin: base, "X-Masala-Language": locale, Cookie: cookie },
      body: JSON.stringify(body), signal: AbortSignal.timeout(65000),
    });
    if (response.headers.get("set-cookie")) cookie = response.headers.get("set-cookie").split(";")[0];
    assert.equal(response.status, 200, `${path} HTTP ${response.status}`);
    return response.json();
  }
  await post("session", { adultConfirmed: true });
  const answers = [{ question: "How do you start a conversation?", summary: "I listen first and open up gradually." }];
  const next = await post("interview/next", { answers, skipped: 0, sendApproved: true });
  assert.equal(next.completed, false);
  assert.equal(next.options.length, 3);
  assert.equal(new Set(next.options).size, 3);
  const text = [next.question, ...next.options].join(" ");
  assert.equal(/[\u3040-\u30ff\u3400-\u9fff]/.test(text), locale === "ja");
  for (const [approved, skipped] of [[[], 6], [answers, 5], [Array(6).fill(answers[0]), 0], [Array(8).fill(answers[0]), 0]]) {
    assert.deepEqual(await post("interview/next", { answers: approved, skipped, sendApproved: true }), { completed: true, question: null });
  }
  console.log(`PASS ${locale}: three answer choices; six-slot ending for answered, skipped, mixed and legacy over-limit interviews`);
}
