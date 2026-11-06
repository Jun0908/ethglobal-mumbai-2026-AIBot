import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const base='http://127.0.0.1:3000';
async function session(){const r=await fetch(base+'/api/session',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({adultConfirmed:true})});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];}
const jars=new Map();
async function post(cookie,path,body,status=200){const r=await fetch(base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:base,Cookie:cookie+(jars.has(cookie)?'; '+jars.get(cookie):''),'X-Masala-Language':'en'},body:JSON.stringify(body)});const extra=r.headers.get('set-cookie');if(extra?.startsWith('masala_companion='))jars.set(cookie,extra.split(';')[0]);const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;}
if(process.argv.includes('--resume')){const fixture=JSON.parse(await readFile('.data/companion-resume-test.json','utf8'));const cookie=await session();jars.set(cookie,fixture.browserCookie);const result=await post(cookie,'companion',{op:'get',target:'demo-playful',locale:'en'});assert.equal(result.state.revision,fixture.revision);console.log('PASS: demo companion records survive server restart and session renewal');process.exit(0);}
const cookie=await session(),other=await session();let s=(await post(cookie,'companion',{op:'get',target:'demo-playful',locale:'en'})).state;
const mutate=async(op,extra={})=>{const body={op,target:'demo-playful',locale:'en',revision:s.revision,turnId:randomUUID(),...extra};const d=await post(cookie,'companion',body);s=d.state;return {body,d};};
const started=await mutate('start');const replay=await post(cookie,'companion',started.body);assert.equal(replay.state.revision,s.revision);await post(cookie,'companion',{...started.body,turnId:randomUUID()},409);
for(const choice of [1,0,2])await mutate('choose',{choice});assert.equal(s.game,null);assert.equal(s.plans.length,1);assert.equal(s.plans[0].adjustment,2);
const isolated=await post(other,'companion',{op:'get',target:'demo-playful',locale:'en'});assert.equal(isolated.state.messages.length,0);
const chat=await mutate('chat',{message:'I like street photography. What kinds of photos do you enjoy taking?'});assert.equal(chat.d.fallback,false);assert.ok(s.messages.at(-1).text.length>0);
await mutate('save',{topic:'games'});assert.ok(s.saved.includes('games'));await mutate('forget',{userId:s.messages[0].id});assert.equal(s.plans.length,0);
const draft=await post(cookie,'persona/photos',{choices:[[0,1],[],[0]],voice:'gentle'});assert.equal(draft.content.personality.socialStyle,null);assert.deepEqual(draft.content.personality.values,['Café','Beach','Photography']);
await post(other,'persona/preview',{draftId:draft.draftId,message:'What would you enjoy doing?'},404);
const preview=await post(cookie,'persona/preview',{draftId:draft.draftId,message:'What would you enjoy on a day off?'});assert.ok(preview.dialogue);
const approved=await post(cookie,'persona/approve',{draftId:draft.draftId,simulationApproved:true,examplesApproved:true,adultConfirmed:true});
const own=await post(cookie,'companion',{op:'get',target:approved.personaId,locale:'en'});assert.equal(own.state.messages.length,0);await post(other,'companion',{op:'get',target:approved.personaId,locale:'en'},403);
const edited=await post(cookie,'persona/photos',{choices:[[2],[],[]],voice:'playful'});const reapproved=await post(cookie,'persona/approve',{personaId:approved.personaId,draftId:edited.draftId,simulationApproved:true,examplesApproved:true,adultConfirmed:true});assert.equal(reapproved.personaId,approved.personaId);const restored=await post(cookie,'persona/photos/get',{personaId:approved.personaId});assert.deepEqual(restored.visual.choices,[[2],[],[]]);
await post(cookie,'persona/revoke',{personaId:approved.personaId});await post(cookie,'companion',{op:'get',target:approved.personaId,locale:'en'},403);
await writeFile('.data/companion-resume-test.json',JSON.stringify({browserCookie:jars.get(cookie),revision:s.revision}),{mode:0o600});
console.log('PASS: game, retries, stale revisions, isolation, live chat, dashboard, deletion, photo persona, live preview, ownership and revocation');
