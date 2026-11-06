"use client";
import { characterArt } from "@/lib/character-art";
import { useEffect, useRef, useState } from "react";
import { dimensionIds, type ConversationSummary, type Feelings, type PublicConversation } from "@/lib/conversation";
import type { Reflection } from "@/lib/reflection";
import type { Locale } from "@/lib/i18n";
import { rainStory, storyChoices, storyText } from "@/lib/rain-story";
import CafeScene from "./cafe-scene";
import { cafeStages, cafeTitles } from "@/lib/cafe-adventure";

export type ConversationTarget = { id: string; matchId: string };
type Props = { locale: Locale; demo: boolean; initialTarget: ConversationTarget | null; onHome: () => void; onBusyChange: (busy: boolean) => void };
const dimensions = { pace: ["会話のペース", "Conversation pace"], activities: ["過ごし方", "Time together"], closeness: ["距離の縮め方", "Getting closer"], differences: ["違いへの向き合い方", "Handling differences"] };
const observations = { aligned: ["合う傾向", "Shared preference"], different: ["違いが見えた", "Different preferences"], adapted: ["歩み寄れた", "Found a compromise"], mixed: ["複数の傾向", "Mixed evidence"], unknown: ["まだ分からない", "Not enough evidence"] };

export default function ConversationExperience({ locale, demo, initialTarget, onHome, onBusyChange }: Props) {
  const pick = (ja: string, en: string) => locale === "en" ? en : ja;
  const label = (pair: string[]) => pair[locale === "en" ? 1 : 0];
  const [sessions, setSessions] = useState<ConversationSummary[]>([]);
  const [current, setCurrent] = useState<PublicConversation | null>(null);
  const [target, setTarget] = useState<ConversationTarget | null>(initialTarget);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [reflectionError, setReflectionError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [other, setOther] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [actionsOpen, setActionsOpen] = useState(false);
  const busyRef = useRef(false);
  const booted = useRef(false);
  const currentRef = useRef(current); currentRef.current = current;
  const localeRef = useRef(locale); localeRef.current = locale;
  const turnIds = useRef(new Map<string, string>());
  const transcript = useRef<HTMLDivElement>(null);
  const latestReply = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const reflectionPanel = useRef<HTMLElement>(null);
  async function post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`/api/dialogue/${path}`, { method: "POST", headers: { "Content-Type": "application/json", "X-Masala-Language": locale }, body: JSON.stringify(body), signal: AbortSignal.timeout(65000) });
    const value = await response.json();
    if (!response.ok) throw new Error(value.error || pick("処理できませんでした。再試行できます。", "Could not complete this action. You can retry."));
    return value;
  }
  async function run(action: () => Promise<void>) {
    if (busyRef.current) return false;
    busyRef.current = true; setBusy(true); onBusyChange(true); setError("");
    try { await action(); return true; }
    catch (e) { setError(e instanceof Error ? e.message : pick("処理に失敗しました。", "The action failed.")); return false; }
    finally { busyRef.current = false; setBusy(false); onBusyChange(false); }
  }
  async function list() { setSessions((await post<{ conversations: ConversationSummary[] }>("list", {})).conversations); setLoaded(true); }
  function accept(c: PublicConversation) {
    setCurrent(c);
    setSessions(previous => [{ id: c.id, partnerRef: c.partnerRef, partnerName: c.partnerName, updatedAt: c.updatedAt, revision: c.revision, turns: c.messages.filter(m => m.role === "user" && m.kind !== "story_action").length, storyCompleted: c.story.node === "ending", feelings: c.feelings, report: c.reports.filter(r => r.locale === locale).at(-1) ?? null, dismissed: c.dismissed }, ...previous.filter(s => s.id !== c.id)].sort((a, b) => b.updatedAt - a.updatedAt));
  }
  async function open(companion: ConversationTarget, fresh = false) {
    await run(async () => { const c = await post<PublicConversation>("start", { agentPersonaId: companion.id, matchId: companion.matchId, fresh }); accept(c); setTarget(companion); setShowReflection(false); setOther(!!drafts[c.id]); setActionsOpen(false); setReflectionError(""); });
  }
  async function resume(id: string) {
    await run(async () => { const c = await post<PublicConversation>("get", { gameId: id }); accept(c); setTarget(c.partnerRef.startsWith("demo-") ? { id: c.partnerRef, matchId: "demo-match" } : initialTarget); setShowReflection(false); setOther(!!drafts[c.id]); setActionsOpen(false); setReflectionError(""); });
  }
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void run(async () => { await list(); if (initialTarget) { accept(await post<PublicConversation>("start", { agentPersonaId: initialTarget.id, matchId: initialTarget.matchId })); } });
  }, []);
  const previousLocale = useRef(locale);
  useEffect(() => {
    if (previousLocale.current === locale) return;
    previousLocale.current = locale;
    void run(async () => { await list(); if (currentRef.current) accept(await post<PublicConversation>("get", { gameId: currentRef.current.id })); });
  }, [locale]);
  useEffect(() => { if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight; }, [current?.id, current?.revision]);
  useEffect(() => { heading.current?.focus(); }, [current?.id]);
  useEffect(() => { if (current?.adventure && current.revision > 0) latestReply.current?.focus({ preventScroll: true }); }, [current?.id, current?.revision]);
  useEffect(() => { if (showReflection) { reflectionPanel.current?.scrollIntoView({ block: "start" }); reflectionPanel.current?.focus({ preventScroll: true }); } }, [showReflection]);

  async function send(path: "message" | "action", fields: { message?: string; suggestionId?: string; choiceId?: string }) {
    if (!current) return;
    const body = { gameId: current.id, revision: current.revision, ...fields };
    const key = JSON.stringify([body, locale]);
    const clientTurnId = turnIds.current.get(key) ?? crypto.randomUUID(); turnIds.current.set(key, clientTurnId);
    const ok = await run(async () => {
      const c = await post<PublicConversation>(path, { ...body, clientTurnId });
      accept(c); turnIds.current.delete(key);
      if (path === "message") { setDrafts(previous => ({ ...previous, [c.id]: "" })); setOther(false); }
      else setActionsOpen(false);
    });
    return ok;
  }
  async function reflect() {
    if (!current || analyzing) return;
    setShowReflection(true); setAnalyzing(true); setReflectionError("");
    const id = current.id;
    try {
      const report = await post<Reflection>("reflection", { gameId: id });
      setCurrent(c => c?.id === id ? { ...c, reports: [...c.reports.filter(r => !(r.locale === report.locale && r.revision <= report.revision)), report].sort((a, b) => a.revision - b.revision) } : c);
      if (report.locale === localeRef.current) setSessions(previous => previous.map(s => s.id === id ? { ...s, report: !s.report || s.report.revision <= report.revision ? report : s.report } : s));
    } catch (e) { setReflectionError(e instanceof Error ? e.message : pick("振り返りを作れませんでした。", "Could not generate a reflection.")); }
    finally { setAnalyzing(false); }
  }
  function feedback(feelings: Feelings) { if (current) void run(async () => accept(await post<PublicConversation>("feedback", { gameId: current.id, feelings }))); }
  function jump(messageId: string) {
    const element = document.getElementById(`message-${messageId}`);
    const archive = element?.closest("details");
    if (archive) archive.open = true;
    element?.scrollIntoView({ behavior: "smooth", block: "center" }); element?.focus();
  }
  const report = current?.reports.filter(r => r.locale === locale).at(-1);
  const limit = !!current && current.revision >= current.turnLimit;
  const latestPerPartner = sessions.filter((s, index) => sessions.findIndex(item => item.partnerRef === s.partnerRef) === index);
  const draft = current ? drafts[current.id] || "" : "";
  const currentNodeTurns = current?.messages.filter(m => m.role === "user" && m.kind !== "story_action" && m.sceneNode === current.story.node).length ?? 0;
  const adventure = current?.adventure;
  function renderMessage(m: PublicConversation["messages"][number]) {
    return <article ref={m.id === current?.messages.at(-1)?.id ? latestReply : undefined} tabIndex={-1} id={`message-${m.id}`} key={m.id} className={`dialogue-bubble ${m.role} ${m.kind === "story_action" ? "story-action" : ""}`}><strong>{m.role === "user" ? pick("あなた", "You") : current?.partnerName}{m.kind === "story_action" && ` · ${pick("物語の行動", "Story action")}`}</strong><p>{m.text}</p>{m.kind === "suggested_reply" && <small>{pick("選択した返答", "Selected reply")}</small>}</article>;
  }

  return <section className={`conversation-workspace ${adventure ? "cafe-adventure" : ""}`}>
    <div className="conversation-toolbar"><button className="link-button" disabled={busy} onClick={() => { if (current) void run(async () => { await list(); setCurrent(null); setShowReflection(false); }); else onHome(); }}>{current ? pick("← 相手一覧・比較へ", "← Companions & comparison") : pick("← ホームへ", "← Home")}</button><span>{pick("会話は同じログイン中に再開できます。再起動・期限切れで終了します。", "Resume during this sign-in. Sessions end on server restart or expiry.")}</span></div>
    {error && <div className="alert" role="alert">{error}</div>}
    {!current ? <>
      <header className="conversation-heading"><p className="eyebrow">MEET. TALK. DISCOVER.</p><h2>{pick("誰と、もう少し話したい？", "Who would you like to know better?")}</h2><p>{pick("会話から、合うところも違うところも見つけよう。まだ話していない相手との相性は分かりません。", "Discover shared preferences and differences through conversation. Untalked-to companions have no compatibility assessment.")}</p></header>
      {!loaded && <p role="status">{pick("会話を読み込んでいます…", "Loading conversations…")}</p>}
      {demo && <div className="companion-grid">{[{ id: "demo-calm", name: "Asha", intro: pick("静かな時間と、ゆっくり深まる会話。", "Quiet moments and conversations that deepen slowly."), tag: "THE THOUGHTFUL ONE" }, { id: "demo-playful", name: "Mira", intro: pick("お互いのチャイを選ぼう。会話の選択で、ふたりの思い出が変わるデート。", "Choose chai for each other. Your replies shape a rainy-day keepsake."), tag: "THE SPONTANEOUS ONE" }].map(p => {
        const session = sessions.find(s => s.partnerRef === p.id);
        return <article className={`companion-tile ${p.id}`} key={p.id}><img className="companion-portrait" src={characterArt(p.id).src} style={{ objectPosition: characterArt(p.id).position }} alt={pick(`${p.name}のイメージ・架空の成人`, `${p.name}, a fictional adult companion`)}/><span className="eyebrow">{p.tag}</span><h3>{p.name}</h3><p>{p.intro}</p><p className="small">{session ? session.report ? pick("振り返りあり", "Reflection available") : pick("会話中", "Conversation started") : pick("未会話・相性は未確認", "Not yet talked · no assessment")}</p><button className="button primary" disabled={busy} onClick={() => void open({ id: p.id, matchId: "demo-match" })}>{session ? pick("続きから話す", "Continue talking") : p.id === "demo-playful" ? pick("チャイデートを遊ぶ", "Play the chai date") : pick("話してみる", "Start talking")} →</button><small>{pick("架空の成人キャラクター", "Fictional adult companion")}</small></article>;
      })}</div>}
      <section className="comparison-section"><h3>{pick("ふたりとの会話を比べる", "Compare your conversations")}</h3><p className="small muted">{pick("各相手との最新のデートを、同じ4つの観点で見比べます。会話量の違いも確認してください。", "Compare the latest date with each companion across four dimensions. Consider the different amounts of conversation too.")}</p>
        <div className="comparison-grid">{(demo ? ["demo-calm", "demo-playful"] : latestPerPartner.map(s => s.partnerRef)).map(ref => {
          const s = latestPerPartner.find(s => s.partnerRef === ref);
          return <article className="comparison-card" key={ref}><h4>{s?.partnerName || (ref === "demo-calm" ? "Asha" : "Mira")}</h4><p className="small">{s ? `${s.turns} ${pick("往復の会話", "conversation exchanges")}` : pick("まだ話していません", "No conversation yet")}</p>{s?.report && s.report.revision < s.revision && <p className="small">{pick("前回の振り返りです。会話画面で更新できます。", "Earlier reflection. Update it from the conversation.")}</p>}
            {dimensionIds.map(id => { const d = s?.report?.dimensions.find(d => d.dimension === id); const dismissed = s?.dismissed.includes(`${s.report?.id}:${id}`); return <div className="comparison-dimension" key={id}><strong>{label(dimensions[id])}</strong><span>{dismissed ? pick("本人が解釈を取り消しました", "Interpretation dismissed") : d ? label(observations[d.observation]) : pick("まだ分からない", "Not enough evidence")}</span>{d && !dismissed && <p>{d.interpretation}</p>}</div>; })}
            {s && <><p className="small">{pick("自分の感覚：", "Your experience: ")}{s.feelings.comfort === "natural" ? pick("自然体で話せた", "Felt natural") : s.feelings.comfort === "effort" ? pick("少し気を使った", "Took some effort") : pick("未回答・まだ分からない", "Unanswered or unsure")}</p><p className="small">{pick("また話したい：", "Talk again: ")}{s.feelings.again === "yes" ? pick("はい", "Yes") : s.feelings.again === "no" ? pick("今はそう思わない", "Not right now") : pick("未回答・まだ分からない", "Unanswered or unsure")}</p><button className="link-button" disabled={busy} onClick={() => void resume(s.id)}>{pick("会話と根拠を見る →", "Open conversation & evidence →")}</button></>}
          </article>;
        })}</div>
      </section>
      {sessions.length > 0 && <details className="conversation-archive"><summary>{pick("これまでのデート", "Your dates so far")} ({sessions.length})</summary>{sessions.map(s => <button className="button secondary" disabled={busy} key={s.id} onClick={() => void resume(s.id)}>{s.partnerName} · {new Date(s.updatedAt).toLocaleTimeString(locale === "en" ? "en-US" : "ja-JP", { hour: "2-digit", minute: "2-digit" })} · {s.turns} {pick("往復", "exchanges")}</button>)}</details>}
    </> : <>
      <header className={`conversation-heading ${current.partnerRef.startsWith("demo-") ? "with-portrait" : ""}`}>{current.partnerRef.startsWith("demo-") && <img className="conversation-heading-portrait" src={characterArt(current.partnerRef).src} style={{ objectPosition: characterArt(current.partnerRef).position }} alt={pick(`${current.partnerName}のイメージ・架空の成人`, `${current.partnerName}, a fictional adult companion`)}/>}<p className="eyebrow">A LITTLE CHAI. A LITTLE CURIOSITY.</p><h2 ref={heading} tabIndex={-1}>{current.partnerName}{pick("と、もう少し。", ", a little longer.")}</h2><p>{adventure ? pick("お互いにチャイを選んで、ふたりの思い出を作ろう。返事を選ぶと、そのまま出来事が進みます。", "Choose a chai for each other and make a memory. Your replies move the experience forward.") : pick("返答を選んで話す。「次の展開」を選んだときだけ、物語が進みます。", "Choose a reply to talk. Only a story action moves the scene forward.")}</p></header>
      <div className="dialogue-layout"><div className="dialogue-main">
        {adventure && <p className="cafe-current-step"><span>{cafeTitles[adventure.stage][locale]}</span><span>{cafeStages.indexOf(adventure.stage)} / 6</span></p>}
        {adventure && current.messages.length > 2 && <details className="cafe-history"><summary>{pick("これまでの会話を読む", "Read the conversation so far")} ({current.messages.length - 2})</summary><div className="cafe-history-messages">{current.messages.slice(0, -2).map(renderMessage)}</div></details>}
        <div className="dialogue-transcript" ref={transcript} role="log" aria-live="polite" aria-relevant="additions" aria-label={pick("会話履歴", "Conversation history")}>
          {(adventure ? current.messages.slice(-2) : current.messages).map(renderMessage)}
        </div>
        {busy && <p className="typing" role="status">{pick("処理しています…", "Working…")}</p>}
        <div className="dialogue-composer"><h3>{adventure ? adventure.stage === "complete" ? pick("まだ話したいことがあれば", "Anything else on your mind?") : pick("あなたは、どうする？", "What would you like to do?") : pick("あなたの返事", "Your reply")}</h3>
          {adventure?.stage === "complete" && target && <button className="button primary cafe-replay" disabled={busy} onClick={() => void open(target, true)}>{pick("別の選び方で、もう一度遊ぶ", "Play again with different choices")} ↗</button>}
          {limit ? <p role="status">{pick("60往復の区切りです。振り返るか、新しいデートを始められます。", "You've reached 60 exchanges. Reflect or start a new date.")}</p> : <>
            {current.story.node === "guessing" ? <div className="reply-options">{rainStory.guessing.choices.map(c => <button disabled={busy} key={c.id} onClick={() => void send("action", { choiceId: c.id })}>{storyText(c.label, locale)}</button>)}</div> : !other && <div className="reply-options">{current.suggestions.locale === locale && current.suggestions.items.map(s => <button disabled={busy} key={s.id} onClick={() => void send("message", { suggestionId: s.id })}><span>{s.text}{s.hint && <small className="cafe-option-hint">{s.hint}</small>}</span><span aria-hidden="true">↵</span></button>)}<button className="reply-other" disabled={busy} onClick={() => setOther(true)}>{adventure ? pick("もう少し話す・自分で書く", "Talk a little more · write your own") : pick("その他・自分で書く", "Other · write your own")}</button></div>}
            {current.story.node !== "guessing" && other && <form onSubmit={e => { e.preventDefault(); if (draft.trim()) void send("message", { message: draft.trim() }); }}><label htmlFor="conversation-message">{pick("自分の言葉で返す", "Reply in your own words")}</label><textarea autoFocus id="conversation-message" rows={3} maxLength={1200} disabled={busy} value={draft} onChange={e => setDrafts(previous => ({ ...previous, [current.id]: e.target.value }))}/><div className="composer-actions"><button className="button primary" disabled={busy || !draft.trim()}>{pick("返事を送る", "Send reply")}</button><button className="link-button" type="button" disabled={busy} onClick={() => setOther(false)}>{pick("選択肢に戻る", "Back to suggestions")}</button></div></form>}
          </>}
        </div>
      </div><aside className="dialogue-aside">
        {adventure ? <CafeScene adventure={adventure} locale={locale}/> : <div className="story-panel"><p className="eyebrow">OUR RAINY-DAY STORY</p><h3>{storyText(rainStory[current.story.node].title, locale)}</h3><p>{storyText(rainStory[current.story.node].description, locale)}</p><span className="story-progress">{current.story.node === "ending" ? pick("物語は完成。会話は続けられます。", "Story complete. Keep talking if you like.") : `${current.story.choices.filter(id => !id.startsWith("answer-")).length} / 3 ${pick("つの行動（香り当ては別に回答）", "story actions (spice answer is an extra step)")}`}</span>
          {current.story.node !== "ending" ? <><button className="button secondary" disabled={busy || limit} aria-expanded={actionsOpen} onClick={() => setActionsOpen(!actionsOpen)}>{pick("次の展開を選ぶ", "Choose the next story action")}</button>{currentNodeTurns >= 2 && <p className="small muted">{pick("このまま話しても、次に進んでも大丈夫。", "Keep talking, or move the story along when you're ready.")}</p>}{actionsOpen && <div className="story-options">{rainStory[current.story.node].choices.map(c => <button disabled={busy || limit} key={c.id} onClick={() => void send("action", { choiceId: c.id })}><strong>{storyText(c.label, locale)}</strong><small>{storyText(c.hint, locale)}</small></button>)}</div>}</> : <><ol className="story-recap">{storyChoices(current.story).map(c => <li key={c.id}>{storyText(c.result, locale)}</li>)}</ol><button className="link-button" disabled={busy || current.requested} onClick={() => void run(async () => accept(await post<PublicConversation>("date", { gameId: current.id })))}>{current.requested ? pick("申請済み", "Request sent") : demo ? pick("デート申請のデモを試す", "Try the date request demo") : pick("デートを申請する", "Request a date")}</button><p className="small muted">{demo ? pick("実際の相手へは送信されません。", "No request is sent to a real person.") : pick("実際の相手の承認は別途必要です。", "The real person's agreement is still required.")}</p></>}
        </div>}
        <div className="reflection-entry"><h3>{pick("会話から見えた相性", "What your conversation reveals")}</h3><p>{pick("共通点・違い・まだ分からない点を、発言を根拠に振り返ります。", "Reflect on shared preferences, differences and unknowns using your actual words.")}</p><button className={`button ${adventure ? "secondary" : "primary"}`} disabled={analyzing} onClick={() => void reflect()}>{analyzing ? pick("振り返りを作成中…", "Creating reflection…") : pick("相性を振り返る", "Reflect on compatibility")}</button><p className="small muted">{pick("いつでも振り返れます。会話は終了しません。", "Reflect whenever you like. Your conversation stays open.")}</p></div>
        {target && <button className="link-button" disabled={busy} onClick={() => void open(target, true)}>{pick("新しいデートを始める（履歴は残ります）", "Start a new date (keeps this history)")}</button>}
      </aside></div>
      {showReflection && <section ref={reflectionPanel} tabIndex={-1} className="reflection-panel" aria-label={pick("相性の振り返り", "Compatibility reflection")}><div className="section-heading"><div><p className="eyebrow">YOUR CONVERSATION, NOT A SCORE</p><h3>{pick("今回の会話を振り返る", "Reflect on this conversation")}</h3></div><button className="link-button" onClick={() => setShowReflection(false)}>{pick("閉じる", "Close")}</button></div><p>{pick("これはAIの見立てです。恋愛の成功確率や、実際の相手の感情を示すものではありません。引用を見て、自分の感覚と比べてください。", "This is an AI interpretation, not a prediction of romantic success or a real person's feelings. Check the quotes against your experience.")}</p>
        {analyzing && <p role="status">{pick("分析中も会話を続けられます。", "You can keep talking while the reflection is being prepared.")}</p>}{reflectionError && <p role="alert">{reflectionError} <button className="link-button" disabled={analyzing} onClick={() => void reflect()}>{pick("再試行", "Retry")}</button></p>}
        {!report && !analyzing && !reflectionError && <button className="button secondary" onClick={() => void reflect()}>{pick("日本語で振り返りを作る", "Create an English reflection")}</button>}
        {report && <><p className="small">{pick("会話の時点：", "Conversation snapshot: ")}{report.revision}{report.revision < current.revision && ` · ${pick("その後の会話があります。更新すると反映されます。", "More conversation has happened. Update to include it.")}`}</p><div className="reflection-grid">{report.dimensions.map(d => {
          const dismissed = current.dismissed.includes(`${report.id}:${d.dimension}`);
          return <article className="reflection-dimension" key={d.dimension}><span className={`observation ${d.observation}`}>{dismissed ? pick("解釈を取り消しました", "Interpretation dismissed") : label(observations[d.observation])}</span><h4>{label(dimensions[d.dimension])}</h4>{!dismissed && <><p>{d.interpretation}</p>{d.evidence.map(e => <button className="evidence-quote" key={e.messageId} onClick={() => jump(e.messageId)}><small>{e.role === "user" ? pick("あなた", "You") : current.partnerName}{e.kind === "suggested_reply" && ` · ${pick("選択した返答", "Selected reply")}`}</small><span>“{e.quote}”</span><small>{pick("元の会話を見る ↗", "View in conversation ↗")}</small></button>)}<p className="small muted">{d.unknowns}</p></>}<button className="link-button" disabled={busy} onClick={() => void run(async () => accept(await post<PublicConversation>("feedback", { gameId: current.id, dismiss: { reportId: report.id, dimension: d.dimension, dismissed: !dismissed } })))}>{dismissed ? pick("解釈を戻す", "Restore interpretation") : pick("この解釈は違う", "This interpretation feels wrong")}</button></article>;
        })}</div></>}
        <div className="personal-feedback"><h4>{pick("あなた自身はどう感じた？（任意）", "How did it feel to you? (optional)")}</h4><p className="small">{pick("AIの見立てとは別に残します。回答しなくても会話できます。", "Saved separately from the AI interpretation. Answering is optional.")}</p><div role="group" aria-label={pick("会話の心地よさ", "How comfortable did it feel?")}>{(["natural", "effort", "unsure"] as const).map((value, i) => <button className="button secondary" aria-pressed={current.feelings.comfort === value} disabled={busy} key={value} onClick={() => feedback({ ...current.feelings, comfort: value })}>{label([["自然体で話せた", "Felt natural"], ["少し気を使った", "Took some effort"], ["まだ分からない", "Not sure yet"]][i])}</button>)}</div><p>{pick("また話したい？", "Would you like to talk again?")}</p><div role="group" aria-label={pick("また話したいか", "Talk again")}>{(["yes", "no", "unsure"] as const).map((value, i) => <button className="button secondary" aria-pressed={current.feelings.again === value} disabled={busy} key={value} onClick={() => feedback({ ...current.feelings, again: value })}>{label([["また話したい", "Yes"], ["今はそう思わない", "Not right now"], ["まだ分からない", "Not sure yet"]][i])}</button>)}</div></div>
      </section>}
    </>}
  </section>;
}
