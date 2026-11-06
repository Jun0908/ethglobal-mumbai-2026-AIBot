import {z} from 'zod';
import type {Locale} from './i18n';
import type {PersonaContent} from './schemas';
import {applyPersonality,personalityChoicesSchema,type PersonalityChoices} from './personality-choices';
export const photoRows = [
 [['カフェ','Café'],['海','Beach'],['街歩き','City walk'],['家でゆっくり','At home']],
 [['屋台','Street food'],['静かなレストラン','Quiet restaurant'],['手料理','Home cooking'],['新しい店','New restaurants']],
 [['写真','Photography'],['音楽','Music'],['アウトドア','Outdoors'],['ゲーム','Games']],
 [['森と山','Forest & mountains'],['歴史ある街','Historic town'],['リゾート','Resort'],['にぎやかな都会','Lively city']],
 [['読書','Reading'],['庭や公園','Gardens & parks'],['ものづくり','Making things'],['水族館','Aquarium']],
 [['ライブ音楽','Live music'],['家で映画','Movie at home'],['夜の散歩','Evening walk'],['お茶とデザート','Tea & dessert']],
] as const;
export const photoPrompts=[['休日、どこに行こう？','Where would you spend a day off?'],['二人で食べるなら？','What would you share?'],['一緒に楽しむなら？','What would you enjoy together?'],['旅に出るなら？','Where would you travel?'],['のんびり過ごすなら？','How would you unwind?'],['二人の夜を楽しむなら？','How would you spend an evening together?']] as const;
export const photoCount=photoRows.length;
export const emptyPhotoChoices=()=>Array.from({length:photoCount},()=>[] as number[]);
export function normalizePhotoChoices(choices:PhotoChoices):PhotoChoices{return Array.from({length:photoCount},(_,i)=>[...(choices[i]??[])]);}
export const photoChoicesSchema=z.array(z.array(z.number().int().min(0).max(3)).max(2)).refine(rows=>rows.length===3||rows.length===photoCount).transform(normalizePhotoChoices);

export type PhotoChoices=number[][];
export type Voice='natural'|'gentle'|'playful';
export const photoSettingsSchema=z.object({choices:photoChoicesSchema,voice:z.enum(['natural','gentle','playful']),personality:personalityChoicesSchema.default({})}).strict();
export function photoPersona(choices:PhotoChoices,voice:Voice,locale:Locale,personality:PersonalityChoices={}):PersonaContent {
 const en=locale==='en';const values=choices.flatMap((row,r)=>row.map(i=>photoRows[r][i][en?1:0]));
 const tone=voice==='natural'?null:voice==='gentle'?(en?'Gentle and unhurried':'穏やかでゆっくり'):(en?'Light and playful':'軽く遊び心のある話し方');
 return applyPersonality({personality:{socialStyle:null,humor:null,values,relationshipPace:null},communication:{tone,sentenceLength:null,asksFollowUpQuestions:null,handlesSilence:null},behaviorExamples:values.length?[{situation:en?'Asked about preferred activities':'一緒に楽しみたいことを聞かれたとき',response:(en?'I would enjoy ':'楽しみたいのは、')+values.join(en?', ':'・'),tendency:en?'Explicit photo preferences only; no biography inferred':'写真で選んだ好み。性格や体験は未推測'}]:[],conflictBehavior:{initialReaction:null,repairStyle:null}},personality,locale);
}
