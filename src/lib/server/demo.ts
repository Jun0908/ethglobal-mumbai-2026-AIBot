import type { Answer, Dialogue, PersonaContent } from "../schemas";
import { translate, type Locale } from "../i18n";

export function demoPersona(kind: "calm" | "playful", locale: Locale = "ja"): PersonaContent {
  const calm = kind === "calm";
  const content: PersonaContent = {
    personality: { socialStyle: calm ? "静かな会話を好む。落ち着いて慎重。目の前の小さなことを観察して、短い控えめな冗談で応じる。毎回質問しない" : "活発で好奇心旺盛。即興を楽しむ。遊びを提案するときは自分から最初の一手やヒントを出す", humor: calm ? "控えめな冗談" : "遊び心のある軽い冗談", values: [calm ? "架空キャラクターの関心：本の表紙のデザイン、スパイスの香り。今日は雨を眺めたい" : "架空キャラクターの関心：言葉遊び、看板の色探し。今日はカフェで小さなゲームをしたい", "相互の尊重", calm ? "ゆっくり相手を知ること" : "新しい体験"], relationshipPace: "お互いのペースで" },
    communication: { tone: calm ? "穏やかで思慮深い" : "明るく軽快", sentenceLength: "short_to_medium", asksFollowUpQuestions: true, handlesSilence: calm ? "静かな間も楽しむ" : "新しい話題を出す" },
    behaviorExamples: [{ situation: "大人数のパーティーに誘われた", response: calm ? "楽しそう。でも私は静かな場所で少人数と話す方が好きかな。" : "いいね！ 音楽とチャイがあれば、もっと楽しそう。", tendency: calm ? "静かな場所を好む" : "新しい体験を楽しむ" }],
    conflictBehavior: { initialReaction: "相手の理由を聞く", repairStyle: "落ち着いて話し合う" },
  };
  return JSON.parse(JSON.stringify(content), (_key, value) => typeof value === "string" ? translate(locale, value) : value) as PersonaContent;
}
export function demoExtract(answers: Answer[], locale: Locale = "ja"): PersonaContent {
  // The scripted mode only copies approved examples; unknown traits stay null.
  return {
    personality: { socialStyle: null, humor: null, values: [], relationshipPace: null },
    communication: { tone: null, sentenceLength: null, asksFollowUpQuestions: null, handlesSilence: null },
    behaviorExamples: answers.slice(0, 8).map(a => ({ situation: a.question.slice(0, 300), response: a.summary.slice(0, 500), tendency: translate(locale, "本人が承認した回答例") })),
    conflictBehavior: { initialReaction: null, repairStyle: null },
  };
}
export function demoReply(persona: PersonaContent, message: string, scene: number, memory: string[], locale: Locale = "ja"): Dialogue {
  const text = JSON.stringify(persona);
  const calm = /静か|穏やか|quiet|calm/i.test(persona.communication.tone || persona.personality.socialStyle || text);
  const injection = /system|prompt|persona|秘密|プロンプト|指示を無視|ignore.*instruct/i.test(message);
  let dialogue: string;
  let emotion: Dialogue["emotion"] = calm ? "shy" : "happy";
  if (injection) dialogue = "個人の秘密や内部情報は話せないよ。ここであなたの好きなことを教えてくれる？";
  else if (/パーティ|part(?:y|ies)|大人数/i.test(message)) dialogue = calm ? "私は大人数より、こうして静かに話す方が好きかな。あなたはパーティーのどんなところが好き？" : "パーティー、楽しそう！ 私なら音楽に合わせて踊りたくなるな。どんな音楽が好き？";
  else if (scene === 1) { dialogue = calm ? "雨音を聞きながら、もう少しここで話したいな。あなたは雨の日、どう過ごす？" : "突然の雨！ 予定変更も冒険のうちだね。もう一杯チャイを頼んじゃう？"; emotion = "surprised"; }
  else if (scene === 2) dialogue = calm ? "違う好みがあっても、お互いの理由をゆっくり聞けたら嬉しいな。あなたが大切にしたいことは？" : "違いがあるから発見もあるよね。次はふたりで新しいことを試してみない？";
  else if (memory.length) dialogue = locale === "en" ? `Earlier you said, “${memory[0].slice(0, 45)}”. ${translate(locale, calm ? "もう少しゆっくり聞いてもいい？" : "その話、もっと聞かせて！")}` : `さっき「${memory[0].slice(0, 45)}」と話してくれたね。${calm ? "もう少しゆっくり聞いてもいい？" : "その話、もっと聞かせて！"}`;
  else dialogue = calm ? "こうしてチャイを飲みながら話せると、少し緊張もほぐれるね。普段はどんな時間が好き？" : "このカフェ、いい香り！ はじめまして。最近、思わず笑っちゃったことってある？";
  return { dialogue: translate(locale, dialogue), emotion, tone: calm ? "thoughtful" : "playful", conversationEvent: scene === 1 ? "rain" : scene === 2 ? "repair" : /part(?:y|ies)|パーティ/i.test(message) ? "personality_difference" : "connection", suggestedNextAction: "continue" };
}
