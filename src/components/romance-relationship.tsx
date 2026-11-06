'use client';
import {characterArt} from '@/lib/character-art';
import {useState} from 'react';
import {Heart,ChatCircleDots,BookOpen,Coffee,Handshake,Question,User,CheckCircle,ArrowsLeftRight,LockKey,Images} from '@phosphor-icons/react';
import {romanceVisuals} from '@/lib/romance-visuals';
import type {RomanceState,StoryId} from '@/lib/romance-story';
import type {Locale} from '@/lib/i18n';

export default function RomanceRelationship({state,locale,story='mira'}:{story?:StoryId;state:Pick<RomanceState,'messages'|'memories'>;locale:Locale}) {
 const [selected,setSelected]=useState<string|null>(null);
 const p=(ja:string,en:string)=>locale==='ja'?ja:en;
 const visual=romanceVisuals(state,story);const character=story==='asha'?'Asha':'Mira';
 const memoryLabels=story==='asha'?[p('本の招待状','Bookshop invitation'),p('声にする練習','Finding a voice'),p('最後の一席','The last seat')]:[p('初めてのカフェ','First café'),p('街を歩いた日','Our photowalk'),p('大切な一枚','A precious photo')];
 const labels=[p('会話','Conversation'),p('好み','Preferences'),p('支え方','Support'),p('距離感','Closeness')];
 const icons=[ChatCircleDots,story==='asha'?BookOpen:Coffee,Handshake,Heart];
 const statuses={unknown:p('まだ不明','Still unknown'),aligned:p('合う点あり','A shared wish'),different:p('違いあり','Different wishes'),mixed:p('共通点も違いも','Shared & different'),adjusted:p('歩み寄れた','Made room for you')};
 const activeNode=visual.nodes.find(n=>n.dimension===selected);
 const memoryChapter=selected?.startsWith('chapter-')?Number(selected.slice(8)):-1;
 const evidence=activeNode?.evidence??visual.memories.filter(m=>Math.floor(m.beat/4)===memoryChapter);
 return <aside id="relationship-panel" className="relationship-panel" aria-label={p('ふたりの距離と相性','Your relationship & discoveries')}>
  <button className="relationship-mobile-link link-button" onClick={()=>document.getElementById('romance-play-main')?.scrollIntoView({block:'start'})}>{p('会話に戻る','Back to conversation')}</button>
  <h2>{p('ふたりの距離','Growing closer')}</h2>
  <ol className="relationship-hearts" aria-label={p('物語の進展','Story milestones')}>
   {[p('出会い','Meeting'),p('親しさ','Familiarity'),p('信頼','Trust'),p('特別','Something special')].map((label,i)=><li key={i} className={i<=visual.milestone?'reached':''} aria-current={i===visual.milestone?'step':undefined}><Heart weight={i<=visual.milestone?'fill':'regular'} aria-hidden/><span>{label}</span></li>)}
  </ol>
  <p className="relationship-note">{visual.friends?p('今は、友達として。','Friends, for now.'):p('この物語で重ねた関係','Milestones in your story')}</p>
  <h2>{p('見えてきた相性','What connects you')}</h2>
  <div className="relationship-map">
   {visual.nodes.slice(0,2).map((node,i)=>renderNode(node,i))}
   <div className="relationship-pair"><img src={characterArt(character).src} alt={character}/><Heart weight="fill" aria-hidden/><span><User weight="duotone" aria-hidden/><small>{p('あなた','You')}</small></span></div>
   {visual.nodes.slice(2).map((node,i)=>renderNode(node,i+2))}
  </div>
  <p className="relationship-note">{p('絵を押すと、ふたりの言葉が見られます','Tap an icon to revisit what you both said')}</p>
  <div className="relationship-memories" aria-label={p('二人の思い出','Shared memories')}>
   {memoryLabels.map((label,i)=>{
    const unlocked=visual.memories.some(m=>Math.floor(m.beat/4)===i);
    return <button key={i} disabled={!unlocked} aria-pressed={selected===`chapter-${i}`} onClick={()=>setSelected(selected===`chapter-${i}`?null:`chapter-${i}`)}><span className={`memory-art memory-art-${i}`} aria-hidden/>{unlocked?<Images aria-hidden/>:<LockKey aria-hidden/>}<span>{label}</span></button>;
   })}
  </div>
  {selected&&<section className="relationship-evidence" aria-live="polite"><div className="relationship-evidence-heading"><h3>{activeNode?labels[visual.nodes.indexOf(activeNode)]:memoryLabels[memoryChapter]}</h3><button className="link-button" onClick={()=>setSelected(null)}>{p('閉じる','Close')}</button></div>
   {!evidence.length?<p>{p('このことは、まだ話していません。これからの会話で見つけよう。','You have not explored this yet. Discover it as you talk.')}</p>:evidence.map(m=><div className="relationship-evidence-pair" key={m.id}>{[m.playerId,m.partnerId].map(id=>{const message=state.messages.find(v=>v.id===id);return message&&<blockquote key={id}><small>{message.role==='user'?p('あなた','You'):character}</small><p>{message.text}</p></blockquote>;})}</div>)}
   {activeNode?.status==='adjusted'&&<p>{p(`次のデートで、${character}が前の希望を覚えて過ごし方を調整しました。`, `On your next date, ${character} recalled your wish and made room for it.`)}</p>}
  </section>}
 </aside>;
 function renderNode(node:typeof visual.nodes[number],i:number){
  const Icon=node.status==='unknown'?Question:icons[i];
  const Badge=node.status==='aligned'?CheckCircle:node.status==='adjusted'?Handshake:ArrowsLeftRight;
  return <button key={node.dimension} className={`relationship-node status-${node.status}`} aria-pressed={selected===node.dimension} onClick={()=>setSelected(selected===node.dimension?null:node.dimension)}><Icon weight="duotone" aria-hidden/><strong>{labels[i]}</strong><span>{node.status!=='unknown'&&<Badge aria-hidden/>}{statuses[node.status]}</span></button>;
 }
}
