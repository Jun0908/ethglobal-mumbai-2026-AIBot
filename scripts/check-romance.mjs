import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3001';let cookie='',state;
async function call(op,fields={},expected=200){const r=await fetch(base+'/api/romance',{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify({op,locale:'ja',...(op==='get'?{}:{revision:state?.revision,turnId:crypto.randomUUID()}),...fields})});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];const d=await r.json();assert.equal(r.status,expected,JSON.stringify(d));if(d.state)state=d.state;return d;}
await call('get');assert.equal(state.step,0);const ownCookie=cookie;
await call('reply',{message:'写真展って、どんな場所で開かれるの？'});assert.equal(state.step,0,'A question must not commit an option');
await call('reply',{option:0});const first=state.messages.length;
await call('reply',{option:0,revision:0},409);assert.equal(state.messages.length,first);
await call('reply',{message:'僕は少し考えてから話す方が落ち着く。'});assert.equal(state.step,2,'Clear free-text preference should progress');await call('reply',{option:2});await call('reply',{option:2});assert.equal(state.paused,true);
await call('get');assert.equal(state.step,4);await call('next');assert.ok(state.messages.at(-1).text.includes('少し考えて'));
for(let i=4;i<12;i++){if(state.paused)await call('next');await call('reply',{option: i===5?1:0});}assert.equal(state.step,12);assert.equal(state.memories.length,12);
const evidence=state.memories.find(m=>m.dimension==='pace');assert.ok(evidence);await call('forget',{memoryId:evidence.id});assert.ok(!state.messages.some(m=>m.id===evidence.playerId));
const savedRevision=state.revision;cookie='';await call('get');assert.equal(state.revision,0);cookie=ownCookie;await call('get');assert.equal(state.revision,savedRevision);
const id=crypto.randomUUID();const body={op:'reply',message:'今日はありがとう。',revision:state.revision,turnId:id};await call('reply',body);const revision=state.revision;await call('reply',body);assert.equal(state.revision,revision);
await call('feeling',{feeling:'effort'});assert.equal(state.feeling,'effort');const mainStep=state.step;await call('practice');assert.equal(state.practice,true);assert.equal(state.step,0);await call('reply',{option:1});await call('restore');assert.equal(state.step,mainStep);assert.equal(state.feeling,'effort');
await call('delete');assert.equal(state.step,0);assert.equal(state.memories.length,0);
console.log('PASS: 3 chapters, declined invitation, reunion, stale revision, ownership, deletion, replay-safe resends, real free-text reply');
