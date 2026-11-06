"use client";
import { useEffect, useRef, useState } from "react";
import type { publicGame } from "@/lib/game";
import type { Locale } from "@/lib/i18n";
import { rainStory, storyChoices, storyText } from "@/lib/rain-story";

type Props = {
  game: ReturnType<typeof publicGame>; locale: Locale; partner: string; busy: boolean; demo: boolean; dateResult: string;
  onAction: (id: string) => void; onChat: (message: string) => Promise<boolean>; onRetry: () => void; onDate: () => void; onHome: () => void;
};
export default function RainGame({ game, locale, partner, busy, demo, dateResult, onAction, onChat, onRetry, onDate, onHome }: Props) {
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const previousRevision = useRef(game.story?.revision);
  const pick = (ja: string, en: string) => locale === "en" ? en : ja;
  useEffect(() => {
    if (previousRevision.current !== game.story?.revision) {
      setChatOpen(false); setMessage(""); heading.current?.focus();
      previousRevision.current = game.story?.revision;
    }
  }, [game.story?.revision]);
  if (!game.story) return null;
  const story = game.story;
  const beat = rainStory[story.node];
  const path = storyChoices(story);
  const lastReply = game.messages.filter(m => m.role === "assistant").at(-1)?.text;
  const firstReaction = game.messages.find(m => m.role === "assistant")?.text;
  const endingTitle = story.choices[2] === "bookshop" ? pick("静かな続きを、ふたりで。", "A quieter chapter together.") : story.choices[2] === "new-market" ? pick("次の寄り道も、ふたりで。", "Another detour together.") : pick("また、一杯のチャイから。", "Another beginning over chai.");
  return <section className={`rain-game route-${story.choices[0] || "start"}`}>
    <header className="rain-heading"><div><p className="eyebrow">A MONSOON MEET-CUTE · {partner}</p><h2 ref={heading} tabIndex={-1}>{game.completed ? endingTitle : storyText(beat.title, locale)}</h2></div><span className="rain-progress">{game.completed ? pick("物語が完成", "Story complete") : `${story.choices.length + 1} / 3 · ${pick("選んで進む", "Choose your next step")}`}</span></header>
    <p className="rain-intro">{game.completed ? pick("同じ雨の日でも、選ぶ道で思い出は変わります。別の選択も試してみよう。", "The same rainy day can hold a different story. Try another path and see what changes.") : pick("3つの選択で、雨の日のデートをつくろう。ボタンを押すと物語が進みます。", "Make this rainy date your own in three choices. Choose an action to move the story forward.")}</p>
    <div className="rain-layout">
      <div className="rain-character"><div className={`date-stage emotion-${game.emotion} ${game.completed ? "" : "rainy"}`}><img src="/chai-date.png" alt={pick("架空の成人キャラクターのポートレート", "Portrait of a fictional adult character")}/><span className="stage-location">{pick("相手のイメージ", "CHARACTER PORTRAIT")}</span><div className="scene-caption"><p className="eyebrow">{game.completed ? "AFTER THE RAIN" : "MUMBAI · MONSOON"}</p><h3>{partner}</h3><p>{demo ? pick("架空の相手とのデート体験", "A date with a fictional companion") : pick("承認された会話傾向を持つAI", "An AI using approved conversation patterns")}</p></div></div>
        <div className="rain-reaction" aria-live="polite"><span className="eyebrow">{partner}</span>{busy ? <p role="status">{pick("返答を考えています…", "Thinking of a reply…")}</p> : <p>{lastReply || pick("外は突然の雨。あなたなら、このあとどう過ごす？", "The rain has caught us by surprise. What would you like to do?")}</p>}</div>
      </div>
      <div className="rain-decisions">
        {game.completed ? <div className="rain-ending l--stack -g:20"><p className="eyebrow">YOUR RAINY-DAY STORY</p><h3>{pick("今日、ふたりに起きたこと", "What happened on your date")}</h3><ol>{path.map((c, i) => <li key={c.id}><small>{[pick("選んだ道", "Your path"), pick("できた思い出", "Your memory"), pick("次のデートの提案", "Your next-date idea")][i]}</small><p>{storyText(c.result, locale)}</p></li>)}</ol>{firstReaction && <div className="rain-outcome"><small>{pick("相手の一面が見えた言葉", "A glimpse of their personality")}</small><p>「{firstReaction}」</p></div>}<p className="small muted">{pick("これはゲーム内の物語です。次の予定はあなたの提案で、実際の相手の同意を示すものではありません。", "This is a story within the game. The next date is your suggestion, not consent from a real person.")}</p><button className="button primary" disabled={busy} onClick={onRetry}>{pick("別の選択で遊び直す →", "Try a different path →")}</button><button className="button secondary" disabled={busy} onClick={onHome}>{pick("別のAIで遊ぶ・ホームへ", "Try another AI · Home")}</button><button className="link-button" disabled={busy || !!dateResult} onClick={onDate}>{demo ? pick("デート申請のデモを試す", "Try the date request demo") : pick("実際のデートを申請する", "Request a real date")}</button>{dateResult && <p role="status">{dateResult}</p>}</div> : <>
          {path.length > 0 && <div className="rain-outcome"><span className="eyebrow">{pick("あなたの選択で…", "BECAUSE OF YOUR CHOICE…")}</span><p>{storyText(path.at(-1)!.result, locale)}</p></div>}
          <p className="rain-situation">{storyText(beat.description, locale)}</p>
          <div className="rain-actions">{beat.choices.map((c, i) => <button key={c.id} disabled={busy} onClick={() => onAction(c.id)}><span className="action-number">0{i + 1}</span><span><strong>{storyText(c.label, locale)}</strong><small>{storyText(c.hint, locale)}</small></span><span aria-hidden="true">→</span></button>)}</div>
          <button className="link-button rain-chat-toggle" disabled={busy} aria-expanded={chatOpen} onClick={() => setChatOpen(!chatOpen)}>{chatOpen ? pick("会話を閉じる", "Close conversation") : pick("自分の言葉で話す（任意）", "Talk in your own words (optional)")}</button>
          {chatOpen && <form className="rain-chat l--stack -g:15" onSubmit={async e => { e.preventDefault(); if (message.trim() && await onChat(message)) setMessage(""); }}><label htmlFor="rain-message">{pick("相手に話しかける", "Say something to your companion")}</label><textarea id="rain-message" rows={3} maxLength={1200} value={message} disabled={busy} onChange={e => setMessage(e.target.value)}/><p className="small muted">{pick("自由会話は場面を進めません。話した後に行動を選べます。", "Conversation does not advance the scene. Choose an action when you are ready.")}</p><button className="button secondary" disabled={busy || !message.trim()}>{pick("話しかける →", "Send message →")}</button></form>}
        </>}
      </div>
    </div>
    {game.messages.length > 0 && <details className="rain-history"><summary>{pick("これまでの会話を見る", "Read your conversation so far")}</summary>{game.messages.map((m, i) => <p key={i}><strong>{m.role === "user" ? pick("あなた", "You") : partner}: </strong>{m.text}</p>)}</details>}
  </section>;
}
