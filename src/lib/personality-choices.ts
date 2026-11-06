import {z} from 'zod';
import type {Locale} from './i18n';
import type {PersonaContent} from './schemas';

export const personalityChoicesSchema=z.object({
  firstMeeting:z.enum(['initiate','observe','listen','depends']).optional(),
  whenClose:z.enum(['laugh','joke','deep','depends']).optional(),
  romancePace:z.enum(['slow','natural','express','depends']).optional(),
  care:z.enum(['remember','words','time','help','depends']).optional(),
  planning:z.enum(['suggest','together','follow','depends']).optional(),
  repair:z.enum(['talk','pause','listen','depends']).optional(),
}).strict();
export type PersonalityChoices=z.infer<typeof personalityChoicesSchema>;
type Text=readonly [string,string];
type Option={id:string;label:Text;detail:Text;example:Text};
type Item={id:keyof PersonalityChoices;title:Text;image:string;options:Option[]};
const depends:Option={id:'depends',label:['場面による','It depends'],detail:['一つに決めず、そのときに合わせる','It changes with the situation'],example:['そのときの気持ちや状況に合わせたいな。','I would adapt to how we feel and the situation.']};
export const personalityItems:Item[]=[
  {id:'firstMeeting',title:['初対面のあなたは？','When you first meet someone?'],image:'first-meeting',options:[
    {id:'initiate',label:['自分から話す','I start talking'],detail:['気になることを、自分から聞いてみる','I break the ice with something I am curious about'],example:['初めまして。ここにはよく来るの？','Nice to meet you. Do you come here often?']},
    {id:'observe',label:['少し様子を見る','I warm up slowly'],detail:['雰囲気がわかると、自然に話せる','I open up once I get a feel for the person'],example:['最初は少し緊張するけど、ゆっくり話せたらうれしいな。','I am a little nervous at first, but I would enjoy talking at our own pace.']},
    {id:'listen',label:['聞く方が多い','I mostly listen'],detail:['相手の話を聞きながら、自分も少しずつ','I listen and share a little at a time'],example:['その話、もう少し聞いてみたいな。','I would like to hear a little more about that.']},depends]},
  {id:'whenClose',title:['仲良くなると、どんなあなた？','What are you like once you are close?'],image:'close-friends',options:[
    {id:'laugh',label:['よく笑う','I laugh a lot'],detail:['小さなことでも、一緒に笑いたい','I enjoy laughing together over little things'],example:['あはは、そういう何気ない話、一緒に笑えるのが好き。','Ha, I love being able to laugh together over little stories like that.']},
    {id:'joke',label:['冗談が増える','I get more playful'],detail:['親しくなると、軽い冗談も楽しむ','I enjoy light jokes when I feel comfortable'],example:['それ、二人だけの小さな恒例になりそうだね。','That could become our own little tradition.']},
    {id:'deep',label:['深い話をする','I enjoy deeper talks'],detail:['大切にしていることも、少しずつ話したい','I gradually share what matters to me'],example:['どうしてそれを大切にしているのか、聞いてみたいな。','I would like to hear why that matters to you.']},depends]},
  {id:'romancePace',title:['恋愛は、どんなペースで？','What pace feels right in romance?'],image:'romance-pace',options:[
    {id:'slow',label:['ゆっくり知りたい','Get to know each other slowly'],detail:['安心できる関係から、少しずつ','I build trust a little at a time'],example:['まずは少しずつ、お互いを知っていきたいな。','I would like us to get to know each other a little at a time.']},
    {id:'natural',label:['気が合えば自然に','Let it develop naturally'],detail:['タイミングを決めず、二人の気持ちで','I follow how we both feel rather than a timetable'],example:['急がず、二人が心地いいタイミングで進めたいな。','I would like us to move at a pace that feels comfortable for both of us.']},
    {id:'express',label:['気持ちは言葉にしたい','I express how I feel'],detail:['好意を感じたら、素直に伝える','When I feel interested, I prefer to say so'],example:['楽しかったら、また会いたいって素直に伝える方かな。','If I enjoyed our time, I would say honestly that I would like to meet again.']},depends]},
  {id:'care',title:['されてうれしいのは？','What makes you feel cared for?'],image:'care',options:[
    {id:'remember',label:['話を覚えてくれる','Remembering what I said'],detail:['小さな好みを覚えていてくれるとうれしい','Remembering little preferences means a lot'],example:['前に話したこと、覚えていてくれたんだ。うれしいな。','You remembered what I told you. That means a lot.']},
    {id:'words',label:['言葉で伝えてくれる','Putting feelings into words'],detail:['感謝や気持ちは、言葉で聞きたい','I appreciate hearing feelings and thanks in words'],example:['そう言ってもらえると、気持ちが伝わってうれしい。','Hearing you say that helps me understand how you feel.']},
    {id:'time',label:['一緒に過ごしてくれる','Spending time together'],detail:['特別なことがなくても、二人の時間が好き','Time together matters, even without a special occasion'],example:['何か特別なことをしなくても、一緒に過ごせるのがうれしいな。','Even without doing anything special, I enjoy spending time together.']},
    {id:'help',label:['行動で助けてくれる','Helping through actions'],detail:['さりげない気遣いに、気持ちを感じる','Thoughtful practical help makes me feel cared for'],example:['手伝ってくれてありがとう。そういう気遣い、うれしいな。','Thank you for helping. I really appreciate that kind of thoughtfulness.']},depends]},
  {id:'planning',title:['二人の予定、どう決めたい？','How do you like making plans?'],image:'planning',options:[
    {id:'suggest',label:['自分から提案する','I like suggesting ideas'],detail:['いいなと思ったら、誘ってみたい','I enjoy offering an idea when something appeals to me'],example:['気になる場所があるんだけど、どうかな？ あなたの案も聞きたい。','There is a place I would like to try. What do you think? I would like to hear your ideas too.']},
    {id:'together',label:['一緒に決めたい','I like deciding together'],detail:['お互いの希望を出して、相談したい','I like sharing wishes and making a plan together'],example:['お互いに一つずつ案を出して、一緒に決めようか。','Shall we each suggest an idea and decide together?']},
    {id:'follow',label:['相手の提案を楽しみたい','I enjoy the other person’s ideas'],detail:['誘ってもらって、新しい楽しみを知りたい','I enjoy being invited to discover something new'],example:['あなたのおすすめを聞いてみたいな。無理なときはちゃんと伝えるね。','I would enjoy hearing your suggestion. I will tell you if it does not work for me.']},depends]},
  {id:'repair',title:['すれ違ったときは？','When you see things differently?'],image:'repair',options:[
    {id:'talk',label:['早めに話したい','I prefer to talk soon'],detail:['気になったことを、落ち着いて伝えたい','I like calmly discussing what bothered me'],example:['少し気になったことがあるんだけど、今話してもいい？','Something has been on my mind. Could we talk about it now?']},
    {id:'pause',label:['少し整理してから','I need a little time first'],detail:['気持ちを整理して、また話したい','I gather my thoughts, then come back to talk'],example:['少し気持ちを整理してから、改めて話せるとうれしいな。','I would appreciate a little time to gather my thoughts, then talk again.']},
    {id:'listen',label:['まず相手の話を聞く','I listen first'],detail:['どう感じたのかを聞いてから、自分も話す','I hear how they felt before sharing my side'],example:['どう感じたか、まず聞かせてもらってもいい？ そのあと私の気持ちも話したいな。','Could I hear how you felt first? Then I would like to share my feelings too.']},depends]},
];

export function applyPersonality(content:PersonaContent,choices:PersonalityChoices,locale:Locale):PersonaContent {
  const result=structuredClone(content),lang=locale==='ja'?0:1;
  for(const item of personalityItems){
    const option=item.options.find(o=>o.id===choices[item.id]);
    if(!option)continue;
    const selected=`${item.title[lang]} ${option.label[lang]} — ${option.detail[lang]}`;
    if(item.id==='firstMeeting')result.personality.socialStyle=selected;
    if(item.id==='whenClose'&&option.id==='joke')result.personality.humor=option.detail[lang];
    if(item.id==='romancePace')result.personality.relationshipPace=selected;
    if(item.id==='care'||item.id==='planning')result.personality.values.push(`${item.title[lang]} ${option.label[lang]}`);
    if(item.id==='repair'){result.conflictBehavior.initialReaction=option.detail[lang];result.conflictBehavior.repairStyle=option.example[lang];}
    result.behaviorExamples.push({situation:item.title[lang],response:option.example[lang],tendency:locale==='ja'?'本人が選んだ傾向の返答例。実体験ではない。':'Example of a self-selected tendency, not a real past event.'});
  }
  return result;
}
