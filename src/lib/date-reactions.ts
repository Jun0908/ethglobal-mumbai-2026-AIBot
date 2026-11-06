import type { Capsule } from './server/store';
import type { Locale } from './i18n';

export function dateReaction(capsule:Capsule|null,stage:'intro'|'proposal'|'rain'|'ending',locale:Locale,partnerPlace='',adjustment=0){
 const choices=capsule?.visual?.personality;
 const p=(ja:string,en:string)=>locale==='ja'?ja:en;
 if(stage==='intro'){
  const first=choices?.firstMeeting==='observe'?p('最初は少しずつ雰囲気を知りたいな。','I like to settle in and get a feel for things first. '):choices?.firstMeeting==='listen'?p('あなたの話も聞きながら決めたいな。','I would like to hear your ideas as we go. '):choices?.firstMeeting==='initiate'?p('一緒に小さなデートを作ってみよう。','Let us make a little date together. '):'';
  const voice=capsule?.visual?.voice==='playful'?p('どんな待ち合わせになるかな？','I wonder where we will meet? '):capsule?.visual?.voice==='gentle'?p('気楽に選んでね。','Choose whatever feels comfortable. '):'';
  return p(`${first}${voice}まずは、どこで待ち合わせたい？`,`${first}${voice}Where would you like to meet first?`);
 }
 if(stage==='proposal'){
  const lead=choices?.planning==='together'?p('お互いに一つずつ案を出して決めたいな。','I like it when we each suggest an idea and decide together. '):choices?.planning==='follow'?p('あなたの希望も聞きながら決めたいな。','I would like to hear what you want, too. '):choices?.planning==='suggest'?p('ひとつ提案してもいい？ ','Can I suggest one idea? '):p('いいね。','Nice. ');
  return p(`${lead}次は${partnerPlace}はどう？ その案で行くか、あなたの案に変えるか、一緒に決めよう。`,`${lead}How about ${partnerPlace} next? We can keep that idea or choose yours.`);
 }
 if(stage==='rain'){
  const lead=choices?.planning==='together'?p('どうするか二人で相談しよう。','Let us decide together. '):choices?.planning==='suggest'?p('まず屋内を探すのもいいね。','We could look for somewhere indoors. '):p('予定を少し変えようか。','Shall we adjust the plan? ');
  return p(`途中で雨！ ${lead}屋内に移る？ 雨上がりを待つ？ 今日は短めにする？`,`Now rain! ${lead}Move indoors, wait it out, or make today shorter?`);
 }
 const end=adjustment===2?p('今日は短めにして、また話せたらうれしいな。','A shorter day is fine. I would like to talk again sometime.'):adjustment===1?p('雨上がりを一緒に待ったのが、今日の思い出だね。','Waiting for the rain together became a memory from today.'):p('屋内でも、二人で決めた時間になったね。','We still made a plan together indoors.');
 const pace=choices?.romancePace==='slow'?p('次も、お互いに心地よいペースで。','Next time, at a pace that feels comfortable for both of us.'):choices?.romancePace==='express'?p('また会えたらうれしい。','I would be glad to see you again.'):'';
 return `${end}${pace}`;
}
