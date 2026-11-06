import type { Locale } from "./i18n";

export type Copy = { ja: string; en: string };
const copy = (ja: string, en: string): Copy => ({ ja, en });
export const storyText = (value: Copy, locale: Locale) => value[locale];
export type StoryNode = "rain" | "cafe" | "market" | "listen" | "plan" | "ending";
export type RainStory = { node: StoryNode; choices: string[]; revision: number };
export type StoryChoice = { id: string; label: Copy; hint: Copy; result: Copy; next: StoryNode };
type StoryBeat = { title: Copy; description: Copy; choices: StoryChoice[] };

export const rainStory: Record<StoryNode, StoryBeat> = {
  rain: {
    title: copy("突然の雨。予定は、白紙。", "Rain arrives. Plans disappear."),
    description: copy("チャイを飲み終えた瞬間、大粒の雨。映画までの道は水たまりだらけ。あと少し、一緒に過ごすなら？", "Just as you finish your chai, rain floods the walk to the cinema. You still have time together. What will you do?"),
    choices: [
      { id: "stay", label: copy("カフェでもう一杯", "Stay for another chai"), hint: copy("雨音を聞きながら、ゆっくり話す", "Make room for a quieter conversation"), result: copy("映画は見送り、窓辺の席へ。店主がスパイスの瓶を並べてくれた。", "You skip the movie and take a window seat. The owner brings over jars of spices."), next: "cafe" },
      { id: "explore", label: copy("傘を借りて市場へ", "Borrow an umbrella and explore"), hint: copy("予定外の小さな冒険へ", "See where a small detour takes you"), result: copy("傘を借りて、屋根のある市場へ。スパイス屋と絵はがき屋から、声がかかる。", "You borrow an umbrella and reach the covered market. A spice stall and a postcard seller catch your attention."), next: "market" },
      { id: "ask", label: copy("相手の希望を聞く", "Ask what they would enjoy"), hint: copy("ふたりのペースを探してみる", "Find a pace that suits you both"), result: copy("店先で雨宿り。相手の反応を聞いてから、過ごし方を決めることにした。", "You pause under the awning, giving your companion room to share what they would enjoy."), next: "listen" },
    ],
  },
  cafe: {
    title: copy("窓辺の小さな発見", "A discovery by the window"),
    description: copy("カルダモン、ジンジャー、シナモン。店主は「次の一杯は、ふたりで決めて」と笑う。", "Cardamom, ginger, cinnamon. The owner smiles: “You two can choose the next blend.”"),
    choices: [
      { id: "blend", label: copy("好きな香りを一つずつ選ぶ", "Each choose a favorite spice"), hint: copy("違う好みを、一杯に混ぜる", "Bring two different tastes together"), result: copy("ふたりで選んだスパイスが、一杯のチャイになった。今日だけのブレンドだ。", "Your two chosen spices become a shared chai: a blend made just for today."), next: "plan" },
      { id: "quiet", label: copy("雨を眺めて、静かに過ごす", "Watch the rain together"), hint: copy("言葉を急がない時間", "Leave a little room for silence"), result: copy("しばらく言葉を休めた。雨音とカップの温かさが、この時間の思い出になった。", "You let the conversation rest. Rain on the window and warm cups become the memory of this moment."), next: "plan" },
      { id: "guess", label: copy("香り当てゲームを提案する", "Suggest a spice guessing game"), hint: copy("外れても、笑えるかも", "A wrong guess can be part of the fun"), result: copy("目を閉じて香り当て。シナモンをジンジャーと間違えて、思わず笑ってしまった。", "Eyes closed, you try guessing the spices. You mistake cinnamon for ginger and laugh at the mix-up."), next: "plan" },
    ],
  },
  market: {
    title: copy("寄り道の行き先は？", "Which stall catches your eye?"),
    description: copy("屋根をたたく雨の音。二つの店の間で、足が止まる。次にすることを選ぼう。", "Rain drums on the roof. You pause between two stalls. Choose what to do next."),
    choices: [
      { id: "spices", label: copy("知らないスパイスを探す", "Discover an unfamiliar spice"), hint: copy("ふたりで初めての香りを試す", "Try an unfamiliar aroma together"), result: copy("見たことのないスパイスを店主に教わった。予定になかった発見を持ち帰る。", "The seller introduces an unfamiliar spice. You leave with a discovery you never planned for."), next: "plan" },
      { id: "postcard", label: copy("今日に似合う絵はがきを選ぶ", "Choose a postcard for today"), hint: copy("雨の日を、一枚の思い出に", "Give the rainy day a keepsake"), result: copy("雨に煙るムンバイの絵はがきを選んだ。今日の寄り道を思い出せそうだ。", "You choose a postcard of Mumbai in the rain: a small reminder of this detour."), next: "plan" },
      { id: "shelter", label: copy("歩くのをやめて、ひと休み", "Slow down and find a seat"), hint: copy("冒険の途中でも、予定を変えていい", "A detour can include a pause"), result: copy("市場の端のベンチでひと休み。急がずに過ごす場所を、ふたりで見つけた。", "You find a bench at the edge of the market, making space to rest instead of rushing on."), next: "plan" },
    ],
  },
  listen: {
    title: copy("聞いた気持ちを、次の一歩へ", "Turn listening into a next step"),
    description: copy("相手の返答を受けて、あなたから過ごし方を提案してみよう。", "After hearing their response, suggest how you would like to spend the time together."),
    choices: [
      { id: "slow", label: copy("静かな席に戻ろう", "Find a quiet seat"), hint: copy("落ち着いて話せる場所へ", "Make space to talk at ease"), result: copy("静かな席に戻り、チャイを飲みながら話すことにした。", "You return to a quiet table and settle into conversation over chai."), next: "plan" },
      { id: "wander", label: copy("屋根のある市場を少し歩こう", "Take a short covered-market walk"), hint: copy("雨に濡れない小さな冒険", "A little adventure out of the rain"), result: copy("雨を避けられる市場を、ゆっくり一周。気になる店の前で足を止めた。", "You take a slow lap of the covered market and pause at a stall that catches your eye."), next: "plan" },
      { id: "balance", label: copy("一杯飲んでから、少し散歩", "A chai first, then a short walk"), hint: copy("落ち着く時間と、冒険を少しずつ", "A little comfort and a little discovery"), result: copy("先にチャイを飲み、雨が弱まってから散歩した。ふたりで予定を組み直せた。", "You share a chai, then walk as the rain eases: a plan you put together instead of following the old one."), next: "plan" },
    ],
  },
  plan: {
    title: copy("雨が上がる。その前に。", "Before the rain clears…"),
    description: copy("予定どおりではなかったけれど、今日だけの時間になった。次に会うなら、どんな過ごし方を提案する？", "It was not the day you planned, but it became its own story. What would you suggest for another meeting?"),
    choices: [
      { id: "bookshop", label: copy("本屋と静かなカフェ", "A bookshop and a quiet cafe"), hint: copy("ゆっくり知り合う続きを", "Leave time to get to know each other"), result: copy("次の提案は、本屋で一冊ずつ選んでから静かなカフェへ。", "Your next-date idea: each pick a book, then find a quiet cafe."), next: "ending" },
      { id: "new-market", label: copy("初めての市場を探検", "Explore a market new to both of you"), hint: copy("次も、知らないものを一緒に", "Share another first discovery"), result: copy("次の提案は、ふたりとも知らない市場で、お気に入りを一つずつ探すこと。", "Your next-date idea: explore a market neither of you knows and each find a favorite stall."), next: "ending" },
      { id: "same-cafe", label: copy("また、このチャイの店で", "Come back to this chai shop"), hint: copy("今日の思い出から、続きを始める", "Let today's memory become a beginning"), result: copy("次の提案は、また同じチャイの店へ。今日の話の続きをしよう。", "Your next-date idea: return to this chai shop and pick up today's conversation."), next: "ending" },
    ],
  },
  ending: { title: copy("雨がくれた、ふたりの物語", "The story the rain gave you"), description: copy("選んだ道と、今日できた思い出を振り返ろう。", "Look back at the path you chose and the memory you made."), choices: [] },
};

export function newRainStory(revision = 0): RainStory { return { node: "rain", choices: [], revision }; }
export function chooseStory(story: RainStory, choiceId: string): RainStory {
  const choice = rainStory[story.node].choices.find(c => c.id === choiceId);
  if (!choice) throw new Error("Invalid story choice");
  return { node: choice.next, choices: [...story.choices, choice.id], revision: story.revision + 1 };
}
export function storyChoices(story: RainStory): StoryChoice[] {
  let node: StoryNode = "rain";
  return story.choices.map(id => {
    const choice = rainStory[node].choices.find(c => c.id === id);
    if (!choice) throw new Error("Invalid story history");
    node = choice.next;
    return choice;
  });
}
export function storyContext(story: RainStory, locale: Locale) {
  return { location: story.choices[0] === "explore" ? "covered market in Mumbai" : "Mumbai chai cafe and nearby covered walkway", situation: storyText(rainStory[story.node].description, locale), outcomes: storyChoices(story).map(c => storyText(c.result, locale)), completed: story.node === "ending" };
}
