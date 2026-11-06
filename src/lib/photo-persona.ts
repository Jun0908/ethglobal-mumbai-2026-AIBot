import type {Locale} from './i18n';
import type {PersonaContent} from './schemas';
export const photoRows = [
 [['カフェ','Café'],['海','Beach'],['街歩き','City walk'],['家でゆっくり','At home']],
 [['屋台','Street food'],['静かなレストラン','Quiet restaurant'],['手料理','Home cooking'],['新しい店','New restaurants']],
 [['写真','Photography'],['音楽','Music'],['アウトドア','Outdoors'],['ゲーム','Games']],
] as const;
export type PhotoChoices=number[][];
export type Voice='natural'|'gentle'|'playful';
export function photoPersona(choices:PhotoChoices,voice:Voice,locale:Locale):PersonaContent {
 const en=locale==='en';const values=choices.flatMap((row,r)=>row.map(i=>photoRows[r][i][en?1:0]));
 const tone=voice==='natural'?null:voice==='gentle'?(en?'Gentle and unhurried':'穏やかでゆっくり'):(en?'Light and playful':'軽く遊び心のある話し方');
 return {personality:{socialStyle:null,humor:null,values,relationshipPace:null},communication:{tone,sentenceLength:null,asksFollowUpQuestions:null,handlesSilence:null},behaviorExamples:values.length?[{situation:en?'Asked about preferred activities':'一緒に楽しみたいことを聞かれたとき',response:(en?'I would enjoy ':'楽しみたいのは、')+values.join(en?', ':'・'),tendency:en?'Explicit photo preferences only; no biography inferred':'写真で選んだ好み。性格や体験は未推測'}]:[],conflictBehavior:{initialReaction:null,repairStyle:null}};
}
