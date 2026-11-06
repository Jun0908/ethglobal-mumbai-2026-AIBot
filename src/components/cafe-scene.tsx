"use client";
import { cafeInvitation, cafeMemoryName, cafeOutcome, cafeStages, cafeTitles, cupNames, type CafeAdventure } from "@/lib/cafe-adventure";
import type { Locale } from "@/lib/i18n";

export default function CafeScene({ adventure: a, locale }: { adventure: CafeAdventure; locale: Locale }) {
  const pick = (ja: string, en: string) => locale === "en" ? en : ja;
  const progress = cafeStages.indexOf(a.stage);
  const cups = [{ who: pick("あなたの一杯", "Your cup"), cup: a.yourCup }, { who: pick("Miraの一杯", "Mira’s cup"), cup: a.herCup }];
  return <section className={`cafe-scene ${a.stage === "complete" || a.stage === "goodbye" ? "rain-cleared" : ""}`} aria-label={pick("ふたりのカフェ", "Your cafe together")}>
    <div className="cafe-window" aria-hidden="true"><span>☂</span><span>{a.stage === "complete" || a.stage === "goodbye" ? "AFTER THE RAIN" : "RAINY DAY · MUMBAI"}</span></div>
    <div className="cafe-scene-body"><p className="eyebrow">OUR LITTLE DETOUR</p><h3>{cafeTitles[a.stage][locale]}</h3>
      <div className="cafe-progress" role="progressbar" aria-label={pick("思い出ができるまで", "Your shared experience")} aria-valuemin={0} aria-valuemax={6} aria-valuenow={progress} aria-valuetext={`${progress} / 6 · ${cafeTitles[a.stage][locale]}`}><span style={{ width: `${progress / 6 * 100}%` }}/></div>
      <p className="small muted">{progress} / 6 · {pick("ふたりの思い出ができるまで", "On the way to your keepsake")}</p>
      <div className="cafe-cups">{cups.map(c => <div className="cafe-cup-place" key={c.who}>
        <div aria-hidden="true" className={`cafe-cup ${a.outcome === "blend" ? "blended" : c.cup || "empty"}`}><span/><span/><span/></div>
        <strong>{c.who}</strong><span>{a.outcome === "blend" ? pick("ふたりのブレンド", "Your shared blend") : c.cup ? cupNames[c.cup][locale] : pick("これから選ぼう", "Waiting to be chosen")}</span>
      </div>)}</div>
      <p className="cafe-event" role="status" key={`${a.stage}-${a.actions.length}`}>{a.notice[locale]}</p>
      {a.stage === "her-cup" && <p className="cafe-clue">{pick("Miraの言葉：「今日はちょっと意外な味を」。迷ったら、本人に聞いてみよう。", "Mira said: “An unexpected flavor today.” Unsure? Ask her what she means.")}</p>}
      {a.memory && <article className="cafe-memory-card" aria-label={pick("ふたりの思い出カード", "Your keepsake card")}>
        <span className="eyebrow">A LITTLE MEMORY · MIRA & YOU</span><h4>“{cafeMemoryName(a, locale)}”</h4><p>{cafeOutcome(a)[locale]}</p><div className="cafe-card-rule"/>
        <p><strong>{pick("Miraからの次の提案", "Mira’s next-date idea")}</strong><br/>{cafeInvitation(a)[locale]}</p>
        {a.stage === "complete" && <span className="cafe-card-stamp">{a.again ? pick("また、次の一杯を。", "Until our next cup.") : pick("今日は、ここまで。ありがとう。", "A lovely memory. Thank you.")}</span>}
      </article>}
      {!a.memory && <p className="small muted">{pick("同じ好みでも、違う好みでも大丈夫。選んだ飲み方が、最後の思い出を変えます。", "Shared or different tastes both work. How you enjoy them changes your keepsake.")}</p>}
    </div>
  </section>;
}
