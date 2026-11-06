import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const logs = [];
async function run(partner, locale) {
  let cookie = '';
  async function post(path, body, lang = locale, expected = 200) {
    const r = await fetch(`${base}/api/${path}`, { method: 'POST', headers: { Origin: base, Cookie: cookie, 'Content-Type': 'application/json', 'X-Masala-Language': lang }, body: JSON.stringify(body), signal: AbortSignal.timeout(65000) });
    if (r.headers.get('set-cookie')) cookie = r.headers.get('set-cookie').split(';')[0];
    const data = await r.json(); assert.equal(r.status, expected, `${path}: ${JSON.stringify(data)}`); return data;
  }
  await post('session', { adultConfirmed: true });
  let c = await post('dialogue/start', { agentPersonaId: partner, matchId: 'demo-match', fresh: true });
  assert.equal(c.messages.length, 1); assert.equal(c.messages[0].kind, 'opening');
  const opening = c.messages[0];
  const messages = locale === 'ja' ? [
    'こんにちは。今日ちょっと緊張してる。',
    'このチャイ、思ったより辛いね。甘いのを想像してた。',
    '今日は仕事で小さなミスをして、ちょっと落ち込んでたんだ。',
    '別の話にしよう。今ここでできる遊びを一つやってみよう。あなたから始めて。',
    'ところで映画は何を見る予定だったっけ？',
    '今は黙ってチャイ飲んでたい。質問はいらないよ。',
  ] : [
    "Hi. I'm a little nervous today.",
    'This chai is spicier than I expected. I imagined it would be sweet.',
    'I made a small mistake at work today and felt a bit down.',
    'Let us change the topic. Start a little game we can play here. You go first.',
    'By the way, which movie had we planned to watch?',
    'I just want to drink my chai quietly now. No questions, please.',
  ];
  async function send(message, choiceId) {
    const body = { gameId: c.id, revision: c.revision, clientTurnId: randomUUID(), ...(choiceId ? { choiceId } : { message }) };
    const started = Date.now(); c = await post(choiceId ? 'dialogue/action' : 'dialogue/message', body);
    logs.push({ partner, locale, user: c.messages.at(-2).text, reply: c.messages.at(-1).text, suggestions: c.suggestions.items.map(s => s.text), ms: Date.now() - started });
    console.log(JSON.stringify(logs.at(-1)));
    await writeFile('.data/conversation-quality.json', JSON.stringify(logs, null, 2));
    assert.equal(c.suggestions.items.length, c.story.node === "guessing" ? 0 : 3);
  }
  for (const text of messages) await send(text);
  const saved = structuredClone(c.messages);
  c = await post('dialogue/get', { gameId: c.id }, locale === 'ja' ? 'en' : 'ja');
  assert.deepEqual(c.messages, saved); assert.notEqual(c.suggestions.locale, locale);
  c = await post('dialogue/get', { gameId: c.id });
  assert.deepEqual(c.messages[0], opening);
  await send(null, 'stay'); await send(null, 'guess');
  assert.equal(c.story.node, 'guessing'); assert(!('gameResult' in c.story));
  await post('dialogue/action', { gameId: c.id, revision: c.revision, clientTurnId: randomUUID(), choiceId: 'bookshop' }, locale, 400);
  await send(null, partner === 'demo-calm' ? 'answer-cinnamon' : 'answer-ginger');
  assert.equal(c.story.node, 'plan'); assert(c.story.gameResult);
  assert.match(c.story.gameResult.en, partner === 'demo-calm' ? /got it right/ : /incorrect/);
  await send(locale === 'ja' ? '誰が何と答えて、正解は何だった？' : 'Who guessed what, and what was the correct answer?');
  const report = await post('dialogue/reflection', { gameId: c.id });
  for (const d of report.dimensions) for (const e of d.evidence) assert(!['opening', 'story_action'].includes(c.messages.find(m => m.id === e.messageId)?.kind));
}
await mkdir('.data', { recursive: true });
await Promise.all(['demo-calm', 'demo-playful'].flatMap(p => ['ja', 'en'].map(l => run(p, l))));
console.log(`PASS ${logs.length} generated exchanges; manually review .data/conversation-quality.json for semantic quality.`);
