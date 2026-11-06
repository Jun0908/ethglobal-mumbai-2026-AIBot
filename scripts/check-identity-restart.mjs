import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
const base='http://127.0.0.1:3201';
let child;
async function start(){child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3201'],{stdio:'ignore',windowsHide:true});for(let tries=0;tries<50;tries++){if(child.exitCode!==null)throw Error('Server exited before ready');try{if((await fetch(base+'/api/config')).ok)return;}catch{}await pause(200);}throw Error('Server did not start');}
async function stop(){if(!child)return;const process=child;child=undefined;process.kill();await new Promise(resolve=>process.once('exit',resolve));}
async function post(path,body,cookie){const r=await fetch(base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:base,...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return {data,cookie:r.headers.getSetCookie()?.[0]?.split(';')[0]};}
try{
 await start();
 const {cookie}=await post('session',{adultConfirmed:true});
 const draft=(await post('persona/photos',{choices:[[0],[],[],[],[],[]],voice:'natural',personality:{}},cookie)).data;
 const approved=(await post('persona/approve',{draftId:draft.draftId,simulationApproved:true,examplesApproved:true,adultConfirmed:true},cookie)).data;
 await stop();await start();
 const session=await fetch(base+'/api/session',{headers:{Cookie:cookie}}).then(r=>r.json());assert(session.personaIds.includes(approved.personaId));
 const visual=(await post('persona/photos/get',{personaId:approved.personaId},cookie)).data;assert(visual.visual);
 console.log('PASS: approved persona remains owned and editable after server restart');
}finally{await stop();}
