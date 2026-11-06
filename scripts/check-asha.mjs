import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const base='http://127.0.0.1:3000',cookies=new Map();let states={};
async function call(story,op,fields={},status=200){const s=states[story];const body={story,op,locale:'ja',...(op==='get'?{}:{revision:s.revision,turnId:randomUUID()}),...fields};const r=await fetch(base+'/api/romance',{method:'POST',headers:{Origin:base,'Content-Type':'application/json',Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; ')},body:JSON.stringify(body)});for(const h of r.headers.getSetCookie()){const [k,v]=h.split(';')[0].split('=');cookies.set(k,v);}const data=await r.json();assert.equal(r.status,status,JSON.stringify(data));if(r.ok)states[story]=data.state;return {body,data};}
await call('mira','get');await call('mira','reply',{option:0});const mira=structuredClone(states.mira);
await call('asha','get');assert.ok(states.asha.messages[0].text.includes('背伸び'));assert.ok(!states.asha.messages[0].text.includes('カメラ'));await call('asha','reply',{option:0});
const question=await call('asha','reply',{message:'朗読会ではどんな本を読むの？'});assert.equal(question.data.fallback,false);assert.equal(states.asha.step,1);assert.ok(!states.asha.messages.at(-1).text.includes('Mira'));
for(let step=1;step<12;step++){if(states.asha.paused)await call('asha','next');await call('asha','reply',{option:step===11?2:0});}assert.equal(states.asha.step,12);assert.ok(states.asha.messages.at(-1).text.includes('その距離'));
await call('mira','get');assert.equal(states.mira.step,mira.step);assert.equal(states.mira.revision,mira.revision);
const oldRevision=states.asha.revision;const reset=await call('asha','delete');assert.equal(states.asha.step,0);assert.equal(states.asha.memories.length,0);assert.ok(states.asha.revision>oldRevision);await call('asha','reply',{revision:oldRevision,option:0},409);
const replay=await fetch(base+'/api/romance',{method:'POST',headers:{Origin:base,'Content-Type':'application/json',Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; ')},body:JSON.stringify(reset.body)});assert.equal(replay.status,200);assert.equal((await replay.json()).state.revision,states.asha.revision);
await call('mira','get');assert.equal(states.mira.revision,mira.revision);await call('mira','delete');assert.equal(states.mira.step,0);
console.log('PASS: distinct Asha live dialogue, 3 chapters, friend ending, independent saves, selective reset, stale revision rejection and idempotent reset');
