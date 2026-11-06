"use client";
import {useEffect,useRef,useState} from 'react';
import {photoRows,photoPrompts,photoCount,emptyPhotoChoices,photoSettingsSchema,type PhotoChoices,type Voice} from '@/lib/photo-persona';
import {personalityItems,type PersonalityChoices} from '@/lib/personality-choices';
import type {Locale} from '@/lib/i18n';

async function call(path:string,body:unknown,locale:Locale='ja',signal?:AbortSignal){
 const r=await fetch('/api/'+path,{method:'POST',headers:{'Content-Type':'application/json','X-Masala-Language':locale},body:JSON.stringify(body),signal:signal??AbortSignal.timeout(45000)});
 const d=await r.json();if(!r.ok)throw Error(d.error);return d;
}
const previewStep=photoCount+personalityItems.length;

export default function PhotoPersonaBuilder({locale,onHome,onApproved,personaId}:{personaId?:string;locale:Locale;onHome:()=>void;onApproved:(id:string)=>void}){
 const p=(ja:string,en:string)=>locale==='ja'?ja:en,lang=locale==='ja'?0:1;
 const [choices,setChoices]=useState<PhotoChoices>(emptyPhotoChoices);
 const [voice,setVoice]=useState<Voice>('natural');
 const [personality,setPersonality]=useState<PersonalityChoices>({});
 const [editingTrait,setEditingTrait]=useState(false);
 const [step,setStep]=useState(0),[busy,setBusy]=useState(false),[loading,setLoading]=useState(!!personaId),[loadFailed,setLoadFailed]=useState(false);
 const [error,setError]=useState(''),[preview,setPreview]=useState(''),[draft,setDraft]=useState(''),[tested,setTested]=useState(false),[consent,setConsent]=useState(false),[message,setMessage]=useState('');
 const lock=useRef(false),heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{
  const controller=new AbortController();let active=true;
  function restore(value:unknown){const parsed=photoSettingsSchema.safeParse(value);if(parsed.success){setChoices(parsed.data.choices);setVoice(parsed.data.voice);setPersonality(parsed.data.personality);}}
  if(personaId){
   setLoading(true);setLoadFailed(false);
   void call('persona/photos/get',{personaId},'ja',controller.signal).then(d=>{if(active&&d.visual)restore(d.visual);}).catch(e=>{if(active){setError(e.message);setLoadFailed(true);}}).finally(()=>{if(active)setLoading(false);});
  }else{
   try{const v=JSON.parse(localStorage.getItem('masala-photo-draft')||'null');if(v)restore({choices:v.choices,voice:v.voice,personality:v.personality??{}});}catch{}
  }
  return()=>{active=false;controller.abort();};
 },[personaId]);
 useEffect(()=>{if(step>0)heading.current?.focus();},[step]);
 async function run(fn:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await fn();}catch(e){setError(e instanceof Error?e.message:'Error');}finally{lock.current=false;setBusy(false);}}
 function save(next:PhotoChoices,nextVoice=voice,nextPersonality=personality){
  setChoices(next);setVoice(nextVoice);setPersonality(nextPersonality);setDraft('');setPreview('');setTested(false);setConsent(false);
  try{localStorage.setItem('masala-photo-draft',JSON.stringify({version:2,choices:next,voice:nextVoice,personality:nextPersonality}));}catch{}
 }
 async function test(){await run(async()=>{
  const d=await call('persona/photos',{choices,voice,personality},locale);setDraft(d.draftId);
  const r=await call('persona/preview',{draftId:d.draftId,message:message.trim()||p('初めて会うなら、一緒に何をして過ごしたい？','What would you enjoy doing on a first meeting?')},locale);setPreview(r.dialogue);setTested(true);
 });}
 const isPhoto=step<photoCount,isPersonality=step>=photoCount&&step<previewStep;
 const item=isPersonality?personalityItems[step-photoCount]:null;
 const title=isPhoto?photoPrompts[step][lang]:item?item.title[lang]:p('あなたの分身、どんな感じ？','Does your twin feel like you?');
 const disabled=busy||loading||loadFailed;
 return <section className="photo-builder">
  <button className="link-button" onClick={onHome} disabled={busy}>{p('← ホーム','← Home')}</button>
  <p className="eyebrow">{isPhoto?`YOUR LITTLE WORLD · ${step+1} / ${photoCount}`:item?`YOUR PERSONALITY · ${step-photoCount+1} / ${personalityItems.length}`:p('分身と話す','MEET YOUR TWIN')}</p>
  <h1 ref={heading} tabIndex={-1}>{title}</h1>
  {error&&<p role="alert">{error}</p>}
  {loading&&<p role="status">{p('保存した分身を読み込んでいます…','Loading your saved twin…')}</p>}
  <fieldset className="builder-fields" disabled={disabled}>
  {isPhoto?<>
   <p>{p('気になる写真を2枚まで。迷ったらスキップできます。','Pick up to two photos. You can skip any question.')}</p>
   <div className="photo-choice-grid">{photoRows[step].map((label,i)=><button key={i} aria-pressed={choices[step].includes(i)} onClick={()=>{
    const row=choices[step];if(!row.includes(i)&&row.length===2)return;save(choices.map((r,j)=>j===step?row.includes(i)?row.filter(v=>v!==i):[...row,i]:r));
   }}><span className={`preference-photo ${step<3?'photo':'extra-photo'}-${(step%3)*4+i}`} aria-hidden/><strong>{label[lang]}</strong>{choices[step].includes(i)&&<span className="photo-selected">{p('選択中','Selected')}</span>}</button>)}</div>
   <div className="builder-actions">
    {step>0&&<button className="button secondary" onClick={()=>setStep(step-1)}>{p('戻る','Back')}</button>}
    <button className="button primary" onClick={()=>{setEditingTrait(false);setStep(step+1);}}>{step===photoCount-1?p('性格も選んでみる →','Choose your personality →'):choices[step].length?p('次へ','Next'):p('スキップ','Skip')}</button>
    {step>=2&&<button className="link-button" onClick={()=>setStep(previewStep)}>{p('ここまでで分身を試す','Try your twin with these choices')}</button>}
   </div>
  </>:item?<>
   <p>{p('近いものを一つ。正解はありません。あとから変更できます。','Choose what feels closest to you. No right answers — you can change it later.')}</p>
   <div className="personality-scene">
    <img src={`/personality-${item.image}.webp`} alt="" width={768} height={512}/>
    <div className="personality-options" role="group" aria-label={item.title[lang]}>
     {item.options.map(option=><button key={option.id} className="personality-option" aria-pressed={personality[item.id]===option.id} onClick={()=>{
      const next={...personality};if(next[item.id]===option.id)delete next[item.id];else Object.assign(next,{[item.id]:option.id});save(choices,voice,next);
     }}><span className="personality-check" aria-hidden>{personality[item.id]===option.id?'✓':'○'}</span><span><strong>{option.label[lang]}</strong><small>{option.detail[lang]}</small></span></button>)}
    </div>
   </div>
   <div className="builder-actions">
    <button className="button secondary" onClick={()=>setStep(step-1)}>{p('戻る','Back')}</button>
    <button className="button primary" onClick={()=>setStep(editingTrait?previewStep:step+1)}>{editingTrait?p('確認画面に戻る','Back to preview'):step===previewStep-1?p('分身を試してみる','Meet your twin'):personality[item.id]?p('次へ','Next'):p('スキップ','Skip')}</button>
    {step>=photoCount+2&&step<previewStep-1&&<button className="link-button" onClick={()=>setStep(previewStep)}>{p('ここまでで分身を試す','Try your twin with these choices')}</button>}
   </div>
  </>:<>
   <div className="photo-summary">{choices.flatMap((r,j)=>r.map(i=><span key={`${j}-${i}`}>{photoRows[j][i][lang]}</span>))}</div>
   <p>{p('選んだ好みや性格を、分身の受け答えに反映します。試して「自分っぽいか」を確認しましょう。','Your choices shape how your twin responds. Try a conversation and see if it feels like you.')}</p>
   <div className="personality-summary">{personalityItems.map((v,i)=>{
    const option=v.options.find(o=>o.id===personality[v.id]);
    return <button key={v.id} className="personality-summary-card" onClick={()=>{setEditingTrait(true);setStep(photoCount+i);}}><img src={`/personality-${v.image}.webp`} width={144} height={96} alt="" loading="lazy"/><span><small>{v.title[lang]}</small><strong>{option?.label[lang]??p('まだ選んでいません','Not selected yet')}</strong><span className="personality-edit">{option?p('変更する','Change'):p('選んでみる','Choose')}</span></span></button>;
   })}</div>
   <p className="small">{p('どの項目からでも追加・変更できます。未設定のままでも試せます。','Add or change any item. You can also try your twin with items left unset.')}</p>
   <div className="voice-options" role="group" aria-label={p('話し方','Voice')}>{(['natural','gentle','playful'] as const).map((v,i)=><button className="button secondary" aria-pressed={v===voice} key={v} onClick={()=>save(choices,v)}>{[p('自然に','Natural'),p('もっと穏やかに','Gentler'),p('もっと軽い感じで','More playful')][i]}</button>)}</div>
   <label htmlFor="twin-preview">{p('分身に聞いてみる（入力は任意）','Ask your twin (optional)')}</label>
   <input id="twin-preview" value={message} maxLength={1200} onChange={e=>setMessage(e.target.value)}/>
   <button className="button primary" onClick={()=>void test()}>{p('分身と話す','Try a conversation')}</button>
   {preview&&<blockquote className="twin-preview" aria-live="polite">{preview}</blockquote>}
   {tested&&<>
    <button className="button secondary" aria-pressed={consent} onClick={()=>setConsent(!consent)}>{p('自分っぽい。この好み・性格と返答例をAIシミュレーションに使ってよい','Feels like me. Approve these preferences, tendencies and examples for AI simulation')}</button>
    <p className="small">{p('公開は、相手とのシミュレーションでの利用を承認する操作です。後から撤回できます。','Publishing approves simulation use. You can revoke it later.')}</p>
   </>}
   <div className="builder-actions">
    <button className="button secondary" onClick={()=>setStep(0)}>{p('写真を選び直す','Change photos')}</button>
    <button className="button primary" disabled={!draft||!tested||!consent} onClick={()=>void run(async()=>{
     const r=await call('persona/approve',{personaId,draftId:draft,simulationApproved:true,examplesApproved:true,adultConfirmed:true},locale);onApproved(r.personaId);
    })}>{p('承認して公開','Approve & publish')}</button>
   </div>
  </>}
  </fieldset>
  {busy&&<p role="status">{p('準備しています…','Getting ready…')}</p>}
  <p className="small">{p('選択内容はこのブラウザに保存されます。写真から性格を決めつけず、自分で選んだ傾向だけを反映します。実体験や相手への好意は作りません。','Choices are saved in this browser. Personality comes only from your selections, not assumptions from photos. No life experiences or feelings toward someone are invented.')}</p>
 </section>;
}
