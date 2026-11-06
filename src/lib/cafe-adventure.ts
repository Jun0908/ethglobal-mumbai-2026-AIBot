import type { Locale } from "./i18n";
import type { Copy, RainStory } from "./rain-story";

const copy = (ja: string, en: string): Copy => ({ ja, en });
export type Cup = "comfort" | "spark";
export type CafeStage = "invite" | "your-cup" | "her-cup" | "taste" | "memory" | "goodbye" | "complete";
export type CafeAdventure = {
  version: 1; stage: CafeStage; yourCup: Cup | null; herCup: Cup | null;
  outcome: "blend" | "individual" | null; memory: "rain" | "surprise" | null;
  again: boolean | null; actions: string[]; chats: number; notice: Copy;
};
export type CafeOption = { id: string; label: Copy; hint: Copy };
const option = (id: string, ja: string, en: string, hintJa: string, hintEn: string): CafeOption => ({ id, label: copy(ja, en), hint: copy(hintJa, hintEn) });
export const cupNames = {
  comfort: copy("シナモンとはちみつ", "Cinnamon & honey"),
  spark: copy("ジンジャーとカルダモン", "Ginger & cardamom"),
};
export const cafeStages: CafeStage[] = ["invite", "your-cup", "her-cup", "taste", "memory", "goodbye", "complete"];
export const cafeTitles: Record<CafeStage, Copy> = {
  invite: copy("雨宿りを、ふたりの寄り道に。", "A rainy-day detour for two."),
  "your-cup": copy("あなたの一杯を、Miraに教えて。", "Let Mira choose your cup."),
  "her-cup": copy("今度は、Miraの一杯。", "Now choose Mira’s cup."),
  taste: copy("ひと口で、違いが見えてきた。", "A sip reveals a difference."),
  memory: copy("今日だけの名前をつけよう。", "Give this moment a name."),
  goodbye: copy("雨上がり。その先は？", "After the rain, what next?"),
  complete: copy("ふたりの雨の日が、一枚に。", "Your rainy day, kept on a card."),
};
export const cafeOpening = copy(
  "雨、しばらく止みそうにないね。せっかくだから、お互いのチャイを選んでみない？ 私は今日、ちょっと意外な味を試したい。あなたの一杯は、あなたの好みを聞いて私が選ぶよ。",
  "The rain looks settled in. Shall we choose a chai for each other? I feel like trying an unexpected flavor today. Tell me what you like, and I’ll choose yours.",
);
export function newCafeAdventure(): CafeAdventure {
  return { version: 1, stage: "invite", yourCup: null, herCup: null, outcome: null, memory: null, again: null, actions: [], chats: 0, notice: copy("今日の目的：お互いに一杯を選んで、ふたりの思い出を作ろう。", "Today: choose a cup for each other and make a memory together.") };
}
export function cafeOptions(a: CafeAdventure): CafeOption[] {
  switch (a.stage) {
    case "invite": return [
      option("cafe-start", "いいね、お互いのチャイを選ぼう", "Yes, let’s choose a chai for each other", "ふたりのチャイ作りが始まる", "Start choosing your cups"),
      option("cafe-ask", "Miraはどんな味が気になる？", "What flavors are you curious about, Mira?", "相手の好みをもう少し聞く", "Hear more about her taste"),
      option("cafe-rest", "まずは雨を眺めて、少し話そう", "Let’s watch the rain and talk first", "急がずに過ごす。いつでも始められる", "Take your time; start whenever you like"),
    ];
    case "your-cup": return [
      option("cafe-own-comfort", "私は甘くてほっとする味がいい", "I’d like something sweet and comforting", "Miraがシナモンとはちみつを選ぶ", "Mira will choose cinnamon and honey"),
      option("cafe-own-spark", "私はぴりっと刺激のある味がいい", "I’d like a warming, spicy kick", "Miraがジンジャーとカルダモンを選ぶ", "Mira will choose ginger and cardamom"),
      option("cafe-own-ask", "二つの味は、どう違うの？", "How do the two blends taste different?", "選ぶ前にメニューを聞く", "Explore the menu before choosing"),
    ];
    case "her-cup": return [
      option("cafe-her-spark", "Miraには、ジンジャーとカルダモンを", "Ginger and cardamom for Mira", "ぴりっとして、爽やかな香り", "A warming kick and a fresh aroma"),
      option("cafe-her-comfort", "Miraにも、シナモンとはちみつを", "Cinnamon and honey for Mira", "甘く、やわらかい香り", "Sweet, with a gentle aroma"),
      option("cafe-hint", "意外な味って、甘さ？ それとも刺激？", "By unexpected, do you mean sweet or spicy?", "Miraの言葉を確かめる", "Ask what she meant"),
    ];
    case "taste": return [
      option("cafe-blend", "二つの香りを混ぜて、ふたりの一杯にしよう", "Let’s blend the two aromas into our own chai", "一緒にブレンドを作る", "Create a shared blend"),
      option("cafe-individual", "好みが違っても、それぞれの一杯を楽しもう", "Let’s enjoy our own cups, even if our tastes differ", "違いを残したまま楽しむ", "Keep your own tastes and enjoy them together"),
      option("cafe-taste-ask", "Miraは、どう飲みたい？", "How would you like to enjoy it, Mira?", "相談してから決める", "Hear her preference first"),
    ];
    case "memory": return [
      option("cafe-memory-rain", "今日の名前は「雨やどりの秘密」にしよう", "Let’s call today “Our rainy-day secret”", "思い出カードに名前を残す", "Name your keepsake card"),
      option("cafe-memory-surprise", "「予定外が、ちょうどいい」ってどう？", "How about “A happy change of plans”?", "思い出カードに名前を残す", "Name your keepsake card"),
      option("cafe-memory-ask", "Miraは今日、何がいちばん印象に残った？", "What will you remember most about today, Mira?", "相手の思い出を聞く", "Hear her memory of the day"),
    ];
    case "goodbye": return [
      option("cafe-again", "また一緒に、次の一杯を選びたい", "I’d like to choose another cup with you", "次に会う約束を、ふたりの物語に残す", "Keep a next-date idea in your story"),
      option("cafe-finish", "今日はありがとう。この思い出を持ち帰ろう", "Thank you for today. Let’s keep this memory", "今日のデートを締めくくる", "Bring today’s date to a close"),
      option("cafe-stay", "もう少しだけ、ここで話していたい", "I’d like to stay and talk a little longer", "結末を急がず、会話を続ける", "Keep talking before you finish"),
    ];
    case "complete": return [];
  }
}
export function cafeMemoryName(a: CafeAdventure, locale: Locale) {
  return (a.memory === "surprise" ? copy("予定外が、ちょうどいい", "A happy change of plans") : copy("雨やどりの秘密", "Our rainy-day secret"))[locale];
}
export function cafeOutcome(a: CafeAdventure): Copy {
  return a.outcome === "blend"
    ? copy("シナモンの甘さとジンジャーの刺激を合わせた、ふたりだけのブレンド。", "Your shared blend: cinnamon sweetness with a ginger kick.")
    : copy("Miraはジンジャーとカルダモン。あなたは自分で選んだ一杯。好みをそろえず、一緒に楽しんだ。", "Ginger and cardamom for Mira, your chosen cup for you. You enjoyed the moment without needing identical tastes.");
}
export function cafeInvitation(a: CafeAdventure): Copy {
  return a.outcome === "blend"
    ? copy("次は、このブレンドに合うお菓子を一つずつ選ばない？", "Next time, shall we each choose a snack to go with our blend?")
    : copy("次は、それぞれ好きなお菓子を選んでみない？ 違う好みも面白そう。", "Next time, shall we each pick our favorite snack? Different tastes could be fun too.");
}
export function chooseCafe(a: CafeAdventure, id: string): { adventure: CafeAdventure; dialogue: Copy } {
  if (!cafeOptions(a).some(o => o.id === id)) throw new Error("Invalid cafe action");
  const next = structuredClone(a); next.actions.push(id); next.chats = 0;
  let dialogue: Copy;
  switch (id) {
    case "cafe-start":
      next.stage = "your-cup";
      next.notice = copy("テーブルに二つのメニュー。お互いの一杯を選び始めた。", "Two blends on the table. Time to choose for each other.");
      dialogue = copy("決まり！ 甘いシナモンとはちみつ、ぴりっと爽やかなジンジャーとカルダモン。あなたは今、どっちの気分？", "Deal! There’s sweet cinnamon and honey, or warming ginger and fresh cardamom. Which suits your mood?"); break;
    case "cafe-ask": case "cafe-hint":
      dialogue = copy("今日は、ジンジャーの刺激とカルダモンの爽やかさが気になる。いつもの甘い一杯から、ちょっと寄り道したいんだ。", "Today I’m curious about ginger’s kick and cardamom’s freshness. A little detour from a sweet cup.");
      next.notice = copy("Miraのヒント：今日は刺激と爽やかさを試したい。", "Mira’s hint: she wants a kick and a fresh aroma today."); break;
    case "cafe-rest": case "cafe-stay":
      dialogue = copy("うん、急がなくていいよ。雨の音、思ったよりにぎやかだね。私はここにいるから、話したいことがあれば聞かせて。", "Of course, no rush. The rain is quite a soundtrack. I’m here if there’s something you’d like to talk about.");
      next.notice = copy("少し寄り道。自分の言葉で話すことも、選択肢から再開することもできる。", "A little pause. Write your own reply or pick an option when you’re ready."); break;
    case "cafe-own-ask":
      dialogue = copy("シナモンとはちみつは甘くてまろやか。ジンジャーとカルダモンはぴりっとして爽やか。私の気分に合わせなくていいから、あなたが飲みたいほうを教えて。", "Cinnamon and honey is sweet and gentle. Ginger and cardamom has a fresh, warming kick. Choose what you want; you don’t need to match me."); break;
    case "cafe-own-comfort": case "cafe-own-spark":
      next.yourCup = id === "cafe-own-comfort" ? "comfort" : "spark"; next.stage = "her-cup";
      next.notice = copy(`Miraがあなたに${cupNames[next.yourCup].ja}を選んだ。`, `Mira chose ${cupNames[next.yourCup].en.toLowerCase()} for you.`);
      dialogue = next.yourCup === "comfort"
        ? copy("じゃあ、あなたにはシナモンとはちみつ。ほっとする甘さがいいって言ってたから。今度は私の番！ さっきの「意外な味」、覚えてる？", "Cinnamon and honey for you, then. You said you wanted comforting sweetness. Now my turn! Remember that unexpected flavor I mentioned?")
        : copy("あなたにはジンジャーとカルダモン。刺激のある味がいいって言ってたからね。私もちょっと冒険したい気分。私には何を選ぶ？", "Ginger and cardamom for you; you asked for a spicy kick. I’m feeling adventurous too. What would you choose for me?"); break;
    case "cafe-her-comfort": case "cafe-her-spark":
      next.herCup = id === "cafe-her-comfort" ? "comfort" : "spark"; next.stage = "taste";
      next.notice = copy("選んだ二つのチャイがテーブルに届いた。", "Your two chosen cups have arrived.");
      dialogue = next.herCup === "spark"
        ? copy("そう、それが気になってたの！ ひと口飲むと、ジンジャーがしっかり効いてる。甘さも少し足してみたいな。二つの香りを混ぜる？ それぞれで楽しむ？", "Yes, that’s the one I was curious about! A sip has quite a ginger kick. I’d enjoy a little sweetness too. Shall we blend the aromas, or enjoy our own cups?")
        : copy("選んでくれてありがとう。ひと口……やさしい甘さだね。でも今日はやっぱりジンジャーも試したいな。甘さと刺激を混ぜる？ 私の一杯だけ替えて、それぞれ楽しむ？", "Thanks for choosing. One sip… that’s gently sweet. I still fancy trying ginger today, though. Shall we blend sweetness and spice, or swap my cup and enjoy our own?"); break;
    case "cafe-taste-ask":
      dialogue = copy("私は甘さと刺激を少しずつ混ぜてみたい。でも、あなたの好きな一杯はそのままでもいいよ。ふたりで同じにする必要はないしね。", "I’d like to try a little sweetness with the spice. But you can keep the cup you like. We don’t have to drink the same thing."); break;
    case "cafe-blend": case "cafe-individual":
      next.outcome = id === "cafe-blend" ? "blend" : "individual"; next.stage = "memory";
      if (next.outcome === "individual") next.herCup = "spark";
      next.notice = cafeOutcome(next);
      dialogue = next.outcome === "blend"
        ? copy("店主に二つの味を少しずつもらって、小さなポットで合わせたら、甘いあとにぴりっとくる！ 私はこれ、好き。予定が崩れたおかげでできた一杯だね。今日に名前をつけるなら？", "The owner brings a little of each blend for our small pot. Sweet, then a kick! I like this. A blend we found because our plans changed. What shall we call today?")
        : copy(`じゃあ私はジンジャーとカルダモン。あなたは${cupNames[next.yourCup!].ja}のままで。相手に合わせて替えなくていいの、気楽だね。この時間に名前をつけるなら？`, `Ginger and cardamom for me, and you keep your ${cupNames[next.yourCup!].en.toLowerCase()}. It’s comfortable not having to match. What shall we call this moment?`); break;
    case "cafe-memory-ask":
      dialogue = next.outcome === "blend"
        ? copy("二つの香りを混ぜようって決めた瞬間かな。私ひとりならジンジャーだけにしてたかも。あの甘いあとにぴりっとくる味は、今日の発見だね。", "The moment we decided to blend the aromas. On my own I might have stuck with ginger. Sweetness followed by that kick is today’s discovery.")
        : copy("それぞれ好きな一杯でいいって決めたこと。無理に同じにしなくても、一緒の時間は楽しめるんだね。", "Deciding we could each keep what we liked. We could enjoy being together without making everything the same."); break;
    case "cafe-memory-rain": case "cafe-memory-surprise":
      next.memory = id === "cafe-memory-rain" ? "rain" : "surprise"; next.stage = "goodbye";
      next.notice = copy(`思い出カード「${cafeMemoryName(next, "ja")}」ができた。`, `Your keepsake, “${cafeMemoryName(next, "en")}”, is ready.`);
      dialogue = copy(`「${cafeMemoryName(next, "ja")}」、いいね。カップの横に書き留めておこう。あ、雨が弱くなってきた。${cafeInvitation(next).ja}`, `“${cafeMemoryName(next, "en")}.” I’ll write it beside our cups. Oh, the rain is easing. ${cafeInvitation(next).en}`); break;
    case "cafe-again": case "cafe-finish":
      next.again = id === "cafe-again"; next.stage = "complete";
      next.notice = copy("今日の思い出が完成。別の選び方で、新しいデートも楽しめる。", "Your memory is complete. A new date can take a different path.");
      dialogue = next.again
        ? copy(`うん、また選ぼう。${next.yourCup === "comfort" ? "今日はほっとする甘さを選んだね。" : "今日は刺激のある味を選んだね。"}次の一杯を考えるの、楽しみにしてる。今日はありがとう！`, `I’d like that. ${next.yourCup === "comfort" ? "You wanted comforting sweetness today." : "You chose a warming kick today."} I’ll look forward to choosing another cup. Thank you for today!`)
        : copy("こちらこそ、ありがとう。今日の一杯と、このカードはいい思い出になったよ。気をつけて帰ってね。", "Thank you too. Our chai and this little card made a lovely memory. Have a safe trip home."); break;
    default: throw new Error("Unknown cafe action");
  }
  return { adventure: next, dialogue };
}
// Only explicit, supported intentions commit an action. Tentative, quoted, past or
// negative statements stay in conversation; the visible options remain available.
export function cafeIntent(a: CafeAdventure, text: string): string | undefined {
  const trimmed = text.trim().replace(/[。.!！]+$/, "");
  const exact = cafeOptions(a).find(o => [o.label.ja, o.label.en].some(s => s.replace(/[。.!！]+$/, "").toLowerCase() === trimmed.toLowerCase()));
  if (exact) return exact.id;
  if (/ない|嫌|やめ|かも|かな|たら|なら|以前|前に|昨日|と言|って言|[「」“”"?？]|\b(not|don't|never|maybe|might|if|would|yesterday|said|used to)\b/i.test(text)) return;
  const rules: Partial<Record<CafeStage, [RegExp, string][]>> = {
    invite: [[/^(お互いのチャイを選ぼう|チャイを選び合おう|遊ぼう|let'?s (play|choose (our |each other'?s )?chai))$/i, "cafe-start"]],
    "your-cup": [[/^(甘い(の|味)?がいい|甘いチャイが好き|i (like|want) sweet chai)$/i, "cafe-own-comfort"], [/^(刺激のある(の|味)?がいい|辛いチャイが好き|i (like|want) spicy chai)$/i, "cafe-own-spark"]],
    "her-cup": [[/^(Miraには)?ジンジャー(とカルダモン)?(にしよう|を選ぶ|でお願い)?$/i, "cafe-her-spark"], [/^(Miraには)?シナモン(とはちみつ)?(にしよう|を選ぶ|でお願い)?$/i, "cafe-her-comfort"]],
    taste: [[/^(混ぜよう|二つを混ぜよう|ブレンドしよう|let'?s (blend|mix)( them)?)$/i, "cafe-blend"], [/^(それぞれ(の一杯)?を楽しもう|let'?s keep our own cups)$/i, "cafe-individual"]],
    goodbye: [[/^(また会いたい|また一緒に飲もう|let'?s meet again)$/i, "cafe-again"], [/^(今日はありがとう|thank you for today)$/i, "cafe-finish"]],
  };
  return rules[a.stage]?.find(([regex]) => regex.test(trimmed))?.[1];
}
export function cafeStory(a: CafeAdventure, before: RainStory): RainStory {
  return { node: a.stage === "complete" ? "ending" : a.stage === "invite" ? "rain" : a.stage === "goodbye" ? "plan" : "cafe", choices: [...a.actions], revision: before.revision + 1 };
}
export function cafeContext(a: CafeAdventure, locale: Locale) {
  return { location: "Inside the chai cafe; remain here", stage: a.stage, yourCup: a.yourCup, mirasChosenCup: a.herCup, outcome: a.outcome, memoryName: a.memory ? cafeMemoryName(a, locale) : null, again: a.again, currentEvent: a.notice[locale], nextOptions: cafeOptions(a).map(o => o.label[locale]), rule: "Only the server commits actions. Chat never completes an activity. Do not introduce quizzes, unseen observations, new games or invented activities. Answer the player, express Mira's own specific taste, then if useful offer one of nextOptions. Do not say they must click a separate story button. No urgency; honor pauses. Mira wants ginger/cardamom today, also enjoys a little cinnamon sweetness. Player's chosen taste is for today, not a permanent trait." };
}
