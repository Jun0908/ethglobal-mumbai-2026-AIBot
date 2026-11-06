import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
async function request(path, raw, cookie = "", origin = base) {
  return fetch(`${base}/api/${path}`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin, ...(cookie ? { Cookie: cookie } : {}) }, body: raw });
}
assert.equal((await request("session", "{" )).status, 400);
assert.equal((await request("session", JSON.stringify({ adultConfirmed: true }), "", "https://untrusted.example")).status, 403);
assert.equal((await request("session", JSON.stringify({ adultConfirmed: false }))).status, 400);
assert.equal((await request("session", JSON.stringify({ adultConfirmed: true, data: "x".repeat(33000) }))).status, 413);
assert.equal((await request("persona/approve", JSON.stringify({ draftId: "unknown" }))).status, 401);
const session = await request("session", JSON.stringify({ adultConfirmed: true }));
assert.equal(session.status, 200);
const cookie = session.headers.get("set-cookie").split(";")[0];
for (let i = 0; i < 40; i++) {
  const response = await request("interview/next", JSON.stringify({ answers: [], skipped: 0, sendApproved: false }), cookie);
  assert.equal(response.status, 400);
}
assert.equal((await request("interview/next", JSON.stringify({ answers: [], skipped: 0, sendApproved: false }), cookie)).status, 429);
console.log("PASS: malformed JSON, cross-origin rejection, adult gate, body limit, anonymous access rejection, per-session rate limit");
