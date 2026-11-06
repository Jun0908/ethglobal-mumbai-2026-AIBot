'use client';
import {useEffect,useRef,useState} from 'react';
import {storyFor,type StoryId,type RomanceState} from '@/lib/romance-story';
import RomanceRelationship from './romance-relationship';
import {characterArt} from '@/lib/character-art';
import type {Locale} from '@/lib/i18n';
type PublicState=Omit<RomanceState,'receipts'|'practiceBase'>&{practice:boolean};
export default function RomanceExperience({locale,onHome,story='mira'}:{locale:Locale;onHome:()=>void;story?:StoryId}){
 const character=story==='asha'?'Asha':'Mira';const {beats,chapters}=storyFor(story);
 const [state,setState]=useState<PublicState|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[text,setText]=useState(''),[history,setHistory]=useState(false),[journal,setJournal]=useState(false),[deleting,setDeleting]=useState(false),[fallback,setFallback]=useState(false);
 const sending=useRef(false),pending=useRef<{key:string;id:string}|null>(null),reply=useRef<HTMLDivElement>(null);
 const p=(ja:string,en:string)=>locale==='ja'?ja:en;
 async function send(op:string,fields:Record<string,unknown>={}){
 if(sending.current)return;sending.current=true;setBusy(true);setError('');
 const body={op,story,locale,revision:state?.revision,...fields};const key=JSON.stringify(body);const turnId=op==='get'?undefined:pending.current?.key===key?pending.current.id:crypto.randomUUID();if(turnId)pending.current={key,id:turnId};
 try{const result=await fetch('/api/romance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,turnId}),signal:AbortSignal.timeout(30000)});const data=await result.json();if(!result.ok)throw new Error(data.error);setState(data.state);setFallback(data.fallback);pending.current=null;if(op==='reply')setText('');setDeleting(false);}
 catch(e){setError(e instanceof Error?e.message:p('接続できませんでした。再試行できます。','Connection failed. Try again.'));}
 finally{sending.current=false;setBusy(false);}
 }
 useEffect(()=>{void send('get'); /* eslint-disable-next-line react-hooks/exhaustive-deps */},[]);
 useEffect(()=>{if(state?.revision)reply.current?.focus({preventScroll:true});},[state?.revision]);
 const visibleStep=state?.paused?Math.max(0,state.step-1):(state?.step??0);
 const chapter=Math.min(2,Math.floor(visibleStep/4)),scene=state&&beats[Math.min(visibleStep,11)];
 const emotion=state?.emotion??'happy';
 const feeling={happy:p('楽しそうに笑う','Smiling warmly'),shy:p('少し目をそらして微笑む','Glancing away with a small smile'),neutral:p('こちらを見て、言葉を待つ','Watching you, giving you room'),troubled:p('少し考え込む','Taking a moment to think')}[emotion];
 return <section className={`romance-game story-${story}`}>
 <div className="conversation-toolbar"><button className="link-button" disabled={busy} onClick={onHome}>{p('← ホーム','← Home')}</button><span>{p(`架空の成人${character} · ３話の物語`,`${character}, a fictional adult · A story in three chapters`)}</span><button className="link-button" onClick={()=>setJournal(!journal)} aria-expanded={journal}>{p('思い出と相性','Memories & discoveries')}</button></div>
 {error&&<div className="alert" role="alert">{error} <button onClick={()=>void send('get')}>{p('続きを読み直す','Reload story')}</button></div>}
 {!state?<p role="status">{p('物語を読み込んでいます…','Loading your story…')}</p>:<>
 <p className="eyebrow">{p(`第${chapter+1}話`, `CHAPTER ${chapter+1}`)} · {chapters[chapter][locale]}</p>
 {state.practice&&<p role="status">{p('別の選び方を試しています。本編の記録は残っています。','Trying a different path. Your original story is saved.')} <button disabled={busy} onClick={()=>void send('restore')}>{p('本編へ戻る','Return to original story')}</button></p>}
 <button className="relationship-mobile-link button secondary" onClick={()=>document.getElementById('relationship-panel')?.scrollIntoView({block:'start'})}>{p('ハート・相性図を見る','See hearts & compatibility')}</button>
 <div className="romance-play-layout"><div id="romance-play-main" className="romance-play-main">
 <div className={`romance-stage emotion-${emotion} chapter-${chapter}`}>
 {story==='asha'||emotion==='happy'?<img className="romance-portrait" src={characterArt(character).src} alt={character}/>:<div className={`romance-expression expression-${emotion}`} role="img" aria-label={feeling}/>}
 <div className="romance-caption"><p>{scene?.scene[locale]}</p><span>{feeling}</span></div>
 </div>
 <div className="romance-dialogue" ref={reply} tabIndex={-1} aria-live="polite">
 <strong>{character}</strong>{state.messages.filter(m=>m.role==='assistant').slice(-(state.paused?1:2)).map(m=><p key={m.id}>{m.text}</p>)}
 </div>
 {state.paused&&<section className="romance-ending"><h3>{state.step===12?p('また、待ち合わせよう。','Until we meet again.'):p('今日の時間が、次の出会いにつながる。','Today becomes part of your next meeting.')}</h3><p>{p('下の「思い出と相性」で、二人が話したことを振り返れます。','Open Memories & discoveries to revisit what you both expressed.')}</p>{state.step<12&&<button className="button primary" disabled={busy} onClick={()=>void send('next')}>{p('次のデートへ','Meet again')} →</button>}<button className="button secondary" onClick={()=>setJournal(true)}>{p('思い出と相性を見る','See memories & discoveries')}</button></section>}
 {busy&&<p role="status">{p(`${character}が言葉を選んでいます…`,`${character} is finding words…`)}</p>}
 {!state.paused&&state.step<12&&<div className="reply-options">{beats[state.step].options.map((o,index)=><button key={`${state.step}-${index}`} disabled={busy} onClick={()=>void send('reply',{option:index})}>{o.label[locale]}</button>)}</div>}
 <form className="romance-composer" onSubmit={e=>{e.preventDefault();if(text.trim())void send('reply',{message:text.trim()});}}><label htmlFor="romance-input">{p('その他・自分の言葉で話す','Other · speak in your own words')}</label><textarea id="romance-input" rows={2} maxLength={1200} value={text} disabled={busy} onChange={e=>setText(e.target.value)}/><button className="button primary" disabled={busy||!text.trim()}>{p('伝える','Say it')}</button></form>
 {fallback&&<p className="small" role="status">{p('自由入力の理解が限られています。表示された返答からも進められます。','Free-text understanding is limited right now. The replies above can also move the scene forward.')}</p>}
 </div><RomanceRelationship state={state} locale={locale} story={story}/></div>
 <details open={history} onToggle={e=>setHistory(e.currentTarget.open)}><summary>{p('これまでの会話','Our conversation')}</summary>{state.messages.map(m=><article id={`romance-${m.id}`} className={`dialogue-bubble ${m.role}`} key={m.id}><strong>{m.role==='user'?p('あなた','You'):character}</strong><p>{m.text}</p></article>)}</details>
 {journal&&<section className="romance-journal"><h2>{p('二人について、分かったこと','What you have discovered together')}</h2><p>{p('この物語で表明した希望の振り返りです。一度の返答で性格を決めず、まだ分からないことも残します。','These are wishes expressed in this story. A single reply does not establish a lasting trait, and some things remain unknown.')}</p>
 {(['pace','activities','closeness','differences'] as const).map((dimension,index)=>{const memories=state.memories.filter(m=>m.dimension===dimension);return <article key={dimension}><h3>{[p('会話のペース','Conversation pace'),p('一緒に過ごす時間','Time together'),p('距離の取り方','Closeness'),p('違い・支え方','Differences & support')][index]}</h3>{!memories.length?<p>{p('まだ判断に必要な言葉がありません。','There is not enough evidence yet.')}</p>:memories.map(m=><div key={m.id}><strong>{m.observation==='aligned'?p('共通する希望があった','A shared wish'):p('違いが見えた','A difference emerged')}</strong><p className="small">{p('この場面での返答。恒常的な性格や恋愛の成功を示しません。','A reply in this scene, not a lasting trait or prediction.')}</p>{[m.playerId,m.partnerId].map(id=>{const source=state.messages.find(v=>v.id===id);return source&&<button className="evidence-quote" key={id} onClick={()=>{setHistory(true);setTimeout(()=>document.getElementById(`romance-${id}`)?.scrollIntoView({block:'center'}),0);}}><small>{source.role==='user'?p('あなた','You'):character}</small>“{source.text}”</button>;})}<button className="link-button" disabled={busy} onClick={()=>void send('forget',{memoryId:m.id})}>{p('この記録と根拠を削除する','Remove this memory and its evidence')}</button></div>)}</article>;})}
 <h3>{p('二人の思い出','Shared memories')}</h3>{state.memories.filter(m=>!m.dimension).map(m=><p key={m.id}>✦ {state.messages.find(v=>v.id===m.playerId)?.text} <button className="link-button" disabled={busy} onClick={()=>void send('forget',{memoryId:m.id})}>{p('削除','Remove')}</button></p>)}
 <p>{p('相手に合わせすぎたと感じたら、その感覚も大切にしてください。違いがあるまま関係を続けられます。','Your own comfort matters too. Different preferences can coexist with a growing relationship.')}</p>
 <div role="group" aria-label={p('あなた自身の感想（任意）','Your own experience (optional)')}><p>{p('あなた自身はどう感じた？（任意）','How did it feel to you? (optional)')}</p>{(['natural','effort','unsure'] as const).map((value,index)=><button className="button secondary" key={value} aria-pressed={state.feeling===value} disabled={busy} onClick={()=>void send('feeling',{feeling:value})}>{[p('自然体で話せた','Felt natural'),p('少し気を使った','Took some effort'),p('まだ分からない','Not sure yet')][index]}</button>)}</div>
 {!state.practice&&<button className="button secondary" disabled={busy} onClick={()=>void send('practice')}>{p('本編を残して別の選び方を試す','Try another path and keep this story')}</button>}
 <p className="small">{p('記録は同じブラウザで最終利用から30日保持されます。Cookieを削除した場合は復元できません。','Records last 30 days after your last visit in this browser. Clearing cookies prevents recovery.')}</p><button className="link-button" disabled={busy} onClick={()=>setDeleting(true)}>{p('記録を削除して最初から始める','Delete this record and start over')}</button>{deleting&&<div role="alert"><p>{p('会話・思い出・進行をすべて削除します。','This removes all conversation, memories and progress.')}</p><button disabled={busy} onClick={()=>void send('delete')}>{p('削除して始める','Delete and begin')}</button><button onClick={()=>setDeleting(false)}>{p('戻る','Cancel')}</button></div>}
 </section>}
 </>}
 </section>;
}
