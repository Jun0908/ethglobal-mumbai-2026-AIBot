import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keepsPlayerPerspective } from '../src/lib/suggestion-quality';
test('reject observed reversed ownership and questions after requested silence', () => {
  for (const [player, candidate] of [
    ['今日ちょっと緊張してる。', '緊張する理由、聞いてもいい？'],
    ['今日ちょっと緊張してる。', '今日は特に何かあったの？話したければ聞くよ。'],
    ['仕事でミスして落ち込んだ。', 'どんなことがあったの？'],
    ["I feel nervous.", 'Why are you nervous?'],
    ['I made a mistake.', 'What mistake did you make?'],
    ['黙ってチャイ飲んでたい。', 'どうして黙っていたいの？'],
  ]) assert.equal(keepsPlayerPerspective(player, candidate), false, candidate);
  assert(keepsPlayerPerspective('緊張してる。', '聞いてくれてありがとう。'));
  assert(keepsPlayerPerspective('仕事でミスした。', '今日は別の話がしたい。'));
  assert(keepsPlayerPerspective('映画が好き。', '好きな映画のジャンルは？'));
});
