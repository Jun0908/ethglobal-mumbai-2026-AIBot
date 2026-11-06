import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newRomance,chooseRomance,resumeChapter,storyFor,allowedFreeIntent} from '../src/lib/romance-story';
import {romanceVisuals} from '../src/lib/romance-visuals';
test('Asha has a distinct bilingual bookshop story and every offered route can progress',()=>{
 const {beats,chapters}=storyFor('asha');assert.equal(beats.length,12);assert.equal(chapters.length,3);assert.ok(!JSON.stringify(beats).includes('Mira'));assert.ok(!JSON.stringify(beats).includes('camera'));
 for(const locale of ['ja','en'] as const)for(let path=0;path<3;path++){let s=newRomance(locale,'asha');for(let i=0;i<12;i++){assert.equal(beats[i].options.length,3);if(s.paused)s=resumeChapter(s,locale,'asha');s=chooseRomance(s,path,locale,undefined,'asha');}assert.equal(s.step,12);assert.equal(s.memories.length,12);assert.equal(romanceVisuals(s,'asha').friends,path===2);assert.throws(()=>resumeChapter(s,locale,'asha'));}
});
test('Asha remembers actual words and adjusts the following meeting without borrowing Mira scenes',()=>{
 let s=newRomance('ja','asha');for(let i=0;i<4;i++)s=chooseRomance(s,i===1?1:0,'ja',undefined,'asha');const quote=s.messages.find(m=>m.id===s.memories[1].playerId)!.text;s=resumeChapter(s,'en','asha');assert.ok(s.messages.at(-1)!.text.includes(quote));assert.equal(romanceVisuals(s,'asha').nodes[0].status,'adjusted');assert.ok(!s.messages.at(-1)!.text.includes('walk slowly'));assert.equal(allowedFreeIntent(1,'何の本が好き？',1,'ja','asha'),undefined);
});
