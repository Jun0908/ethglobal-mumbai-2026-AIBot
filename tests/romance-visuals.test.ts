import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newRomance,chooseRomance,resumeChapter} from '../src/lib/romance-story';
import {romanceVisuals} from '../src/lib/romance-visuals';

test('unknowns, difference, and actual adaptation follow surviving evidence',()=>{
 let s=newRomance('ja');assert.ok(romanceVisuals(s).nodes.every(n=>n.status==='unknown'));
 for(let i=0;i<4;i++)s=chooseRomance(s,i===1?1:0,'ja');
 assert.equal(romanceVisuals(s).milestone,1);
 assert.equal(romanceVisuals(s).nodes[0].status,'different');
 s=resumeChapter(s,'ja');assert.equal(romanceVisuals(s).nodes[0].status,'adjusted');
 s.messages=s.messages.filter(m=>m.id!==s.memories[1].playerId);
 assert.equal(romanceVisuals(s).nodes[0].status,'unknown');
});
test('friendship ending never fills the special romantic heart',()=>{
 let s=newRomance('en');for(let i=0;i<12;i++){if(s.paused)s=resumeChapter(s,'en');s=chooseRomance(s,i===11?2:0,'en');}
 assert.equal(romanceVisuals(s).friends,true);assert.equal(romanceVisuals(s).milestone,2);
});
