import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.DEMO_BASE_URL || 'https://love-match-masala.vercel.app';
const dir=resolve(process.env.DEMO_VIDEO_DIR || 'output/demo-video');
await mkdir(dir+'/raw',{recursive:true});
await mkdir(dir+'/stills',{recursive:true});
const browser=await chromium.launch({headless:true,channel:process.env.DEMO_BROWSER_CHANNEL || 'msedge'});
const sources={};const clips=[];let owner,visitor,ownerCtx,visitorCtx;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function actor(name){
 const ctx=await browser.newContext({viewport:{width:1920,height:960},deviceScaleFactor:1,recordVideo:{dir:dir+'/raw',size:{width:1920,height:960}},locale:'en-US'});
 await ctx.addInitScript(()=>{localStorage.setItem('masala-language','en');});
 const start=Date.now();const page=await ctx.newPage();page.setDefaultTimeout(45000);
 sources[name]={start,video:await page.video().path()};
 await page.addInitScript(()=>{document.addEventListener('DOMContentLoaded',()=>{const dot=document.createElement('div');dot.id='demo-recording-cursor';dot.style.cssText='position:fixed;width:22px;height:22px;border:2px solid #c65e35;background:#c65e3540;border-radius:50%;pointer-events:none;z-index:2147483647;left:-50px;top:-50px;transform:translate(-50%,-50%);';document.body.append(dot);document.addEventListener('mousemove',e=>{dot.style.left=e.clientX+'px';dot.style.top=e.clientY+'px';});document.addEventListener('pointerdown',()=>{dot.animate([{scale:'1'},{scale:'1.8'},{scale:'1'}],{duration:450});});});});
 return {ctx,page};
}
async function click(page,locator){await locator.scrollIntoViewIfNeeded();const b=await locator.boundingBox();if(!b)throw Error('No click target');await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:20});await sleep(350);await locator.click();await sleep(500);}
async function center(page,locator){await locator.evaluate(el=>el.scrollIntoView({block:'center',behavior:'smooth'}));await sleep(850);}
async function clip(actorName,name,run,hold=2500){const page=actorName==='owner'?owner:visitor;const start=(Date.now()-sources[actorName].start)/1000;await run();await sleep(hold);const end=(Date.now()-sources[actorName].start)/1000;clips.push({name,source:actorName,start,end});await page.screenshot({path:dir+'/stills/'+name+'.png'});console.log('Captured '+name+' ('+(end-start).toFixed(1)+'s)');await writeFile(dir+'/capture.json',JSON.stringify({base,sources,clips},null,2));}
async function chat(message,name){
 await clip('visitor',name+'_send',async()=>{const field=visitor.locator('#companion-message');await center(visitor,field);await field.pressSequentially(message,{delay:40});},1000);
 const response=visitor.waitForResponse(r=>r.url().endsWith('/api/companion')&&r.request().method()==='POST');
 await click(visitor,visitor.getByRole('button',{name:'Send',exact:true}));
 const r=await response;if(!r.ok())throw Error('Chat failed '+r.status());
 const data=await r.json();if(data.fallback)throw Error('LLM fallback during recording');
 await visitor.locator('#companion-message').waitFor({state:'visible'});await sleep(1200);
 await clip('visitor',name+'_reply',async()=>{await center(visitor,visitor.locator('.companion-bubble').last());},6500);
}
try{
 ({ctx:ownerCtx,page:owner}=await actor('owner'));
 await owner.goto(base);await owner.locator('.hero-art img').waitFor();await owner.evaluate(()=>document.fonts.ready);await sleep(1500);
 await clip('owner','home',async()=>{await owner.mouse.move(850,800,{steps:15});},7500);
 await clip('owner','create',async()=>{await click(owner,owner.locator('.adult-check input'));await click(owner,owner.locator('.hero-actions').getByRole('button',{name:'Create your AI twin'}));await owner.locator('.photo-choice-grid').waitFor();},3000);
 await clip('owner','photos',async()=>{await click(owner,owner.locator('.photo-choice-grid button').nth(0));await click(owner,owner.locator('.photo-choice-grid button').nth(2));await sleep(1800);await click(owner,owner.getByRole('button',{name:'Next',exact:true}));await click(owner,owner.locator('.photo-choice-grid button').nth(0));},3000);
 await clip('owner','photo_montage',async()=>{for(const choice of [1,0,2,1]){await click(owner,owner.getByRole('button',{name:'Next',exact:true}));await click(owner,owner.locator('.photo-choice-grid button').nth(choice));await sleep(700);}},1500);
 await click(owner,owner.getByRole('button',{name:'Choose your personality →',exact:true}));
 await clip('owner','personality',async()=>{await center(owner,owner.locator('.personality-scene'));await click(owner,owner.locator('.personality-option').nth(1));await sleep(1800);await click(owner,owner.getByRole('button',{name:'Next',exact:true}));await click(owner,owner.locator('.personality-option').nth(0));},3000);
 for(const index of [1,0,1,2]){await click(owner,owner.getByRole('button',{name:'Next',exact:true}));await click(owner,owner.locator('.personality-option').nth(index));}
 await click(owner,owner.getByRole('button',{name:'Meet your twin',exact:true}));
 await clip('owner','preview_setup',async()=>{await owner.locator('.personality-summary').scrollIntoViewIfNeeded();await sleep(1600);await center(owner,owner.locator('#twin-preview'));await owner.locator('#twin-preview').pressSequentially('We have a free afternoon. What would you enjoy doing together?',{delay:35});},2000);
 await click(owner,owner.getByRole('button',{name:'Try a conversation',exact:true}));
 await owner.locator('.twin-preview').waitFor({timeout:65000});
 await clip('owner','preview_reply',async()=>{await center(owner,owner.locator('.twin-preview'));},7500);
 await clip('owner','approve',async()=>{await click(owner,owner.getByRole('button',{name:/Feels like me/}));await click(owner,owner.getByRole('button',{name:'Approve & publish',exact:true}));await owner.locator('.success-page').waitFor();},4500);
 await click(owner,owner.locator('.success-page').getByRole('button',{name:'Back to home',exact:true}));
 await center(owner,owner.getByRole('heading',{name:'Invite a friend to meet your twin',exact:true}));
 await click(owner,owner.getByRole('button',{name:'Create invite link',exact:true}));
 const inviteInput=owner.getByRole('textbox',{name:'Invite link',exact:true});await inviteInput.waitFor();const link=await inviteInput.inputValue();
 await clip('owner','invite',async()=>{await center(owner,owner.getByRole('heading',{name:'Invite a friend to meet your twin',exact:true}));},6500);
 ({ctx:visitorCtx,page:visitor}=await actor('visitor'));
 await visitor.goto(link);await visitor.getByRole('button',{name:'Meet the invited twin →',exact:true}).waitFor();
 await click(visitor,visitor.locator('.adult-check input'));
 await clip('visitor','meet_invited_twin',async()=>{await click(visitor,visitor.getByRole('button',{name:'Meet the invited twin →',exact:true}));await visitor.locator('.companion-experience').waitFor();},4500);
 await chat('A quiet cafe and a little photography walk sounds lovely. What do you enjoy on a day off?','chat_one');
 await chat('I love taking photos of little bookshops. What would you enjoy photographing on our walk?','chat_two');
 await clip('visitor','game_start',async()=>{await click(visitor,visitor.getByRole('button',{name:'Play together',exact:true}));await visitor.locator('.date-plan-game').waitFor();await center(visitor,visitor.locator('.date-plan-game'));},4500);
 await clip('visitor','game_choices',async()=>{for(const i of [0,0]){await click(visitor,visitor.locator('.game-photo-grid button').nth(i));await sleep(1200);await center(visitor,visitor.locator('.date-plan-game'));}},3500);
 await clip('visitor','game_ending',async()=>{await click(visitor,visitor.locator('.game-photo-grid button').nth(1));await visitor.locator('.shared-dashboard').waitFor();await visitor.evaluate(()=>scrollTo({top:100,behavior:'smooth'}));},5000);
 await clip('visitor','dashboard',async()=>{await center(visitor,visitor.locator('.shared-dashboard header'));await visitor.mouse.move(1450,760,{steps:20});},8500);
 await clip('visitor','memories',async()=>{await center(visitor,visitor.locator('.dashboard-plans'));},6500);
 await clip('visitor','continue_in_person',async()=>{await center(visitor,visitor.locator('.dashboard-continuations'));const keep=visitor.getByRole('button',{name:'Keep this idea',exact:false}).first();if(await keep.count())await click(visitor,keep);},7000);
 // End the test invitation after filming, so no recorded token grants continued access.
 const stopResponse=owner.waitForResponse(r=>r.url().endsWith('/api/invite')&&r.request().method()==='POST');
 await click(owner,owner.getByRole('button',{name:'Stop',exact:true}).first());
 if(!(await stopResponse).ok())throw Error('Could not stop recorded invitation');
 console.log('Recorded invite revoked.');
 const revokeResponse=owner.waitForResponse(r=>r.url().endsWith('/api/persona/revoke')&&r.request().method()==='POST');
 await click(owner,owner.getByRole('button',{name:'Withdraw consent',exact:true}));
 if(!(await revokeResponse).ok())throw Error('Could not withdraw synthetic twin consent');
 console.log('Synthetic twin simulation consent withdrawn.');
}catch(e){console.error(e.stack);if(owner)await owner.screenshot({path:dir+'/failure-owner.png'});if(visitor)await visitor.screenshot({path:dir+'/failure-visitor.png'});process.exitCode=1;}
finally{
 // Also attempt cleanup after a partial capture, without exporting session cookies.
 if(owner){
  try{const stop=owner.getByRole('button',{name:'Stop',exact:true});if(await stop.count()===1)await stop.click({timeout:5000});}catch{}
  try{const revoke=owner.getByRole('button',{name:'Withdraw consent',exact:true});if(await revoke.count()===1)await revoke.click({timeout:5000});}catch{}
 }
 await ownerCtx?.close();await visitorCtx?.close();await browser.close();await writeFile(dir+'/capture.json',JSON.stringify({base,sources,clips},null,2));
}
