import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newRomance,chooseRomance,resumeChapter,beats,allowedFreeIntent} from '../src/lib/romance-story';
test('different wishes and declined invitations still permit a coherent three-chapter story',()=>{
 for(const locale of ['ja','en'] as const){let s=newRomance(locale);for(let i=0;i<12;i++){if(s.paused)s=resumeChapter(s,locale);s=chooseRomance(s,2,locale);}assert.equal(s.step,12);assert.equal(s.paused,true);assert.equal(s.memories.length,12);assert.throws(()=>resumeChapter(s,locale));}
});
test('related side questions cannot consume a decision even if the classifier proposes one',()=>{
 assert.equal(allowedFreeIntent(0,'写真展って、どんな場所で開かれるの？',1,'ja'),undefined);
 assert.equal(allowedFreeIntent(0,beats[0].options[1].label.en,1,'en'),1);
 assert.equal(allowedFreeIntent(1,'僕は少し考えてから話す方が落ち着く。',1,'ja'),1);
});
test('reunion recalls the actual player words and never guesses missing memory',()=>{
 let s=newRomance('ja');for(let i=0;i<4;i++)s=chooseRomance(s,i===1?1:0,'ja');assert.throws(()=>chooseRomance(s,0,'ja'));s=resumeChapter(s,'en');assert.ok(s.messages.at(-1)!.text.includes(beats[1].options[1].label.ja));
});
