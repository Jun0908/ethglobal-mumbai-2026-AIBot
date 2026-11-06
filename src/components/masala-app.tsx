"use client";

import { useEffect, useRef, useState } from "react";
import { scenes, type Message } from "@/lib/game";
import { interviewQuestions, scenarios, type Answer, type Dialogue, type PersonaContent } from "@/lib/schemas";

type Config = { demoMode: boolean; llmMode: "demo" | "openai"; provider: string };
type Draft = { draftId: string; content: PersonaContent };
type PublicGame = { id: string; scene: number; sceneTurns: number; completed: boolean; messages: Message[]; emotion: Dialogue["emotion"]; event: string };
type View = "home" | "interview" | "calibrate" | "approved" | "game";
const labels: Record<string, string> = { socialStyle: "会話のスタイル", humor: "ユーモア", values: "大切にすること", relationshipPace: "関係のペース", tone: "話し方", sentenceLength: "文章の長さ", asksFollowUpQuestions: "自然に質問する", handlesSilence: "沈黙への対応", initialReaction: "意見が違ったとき", repairStyle: "すれ違いの解き方" };
const emotionLabels = { neutral: "穏やか", happy: "うれしい", shy: "少し照れている", surprised: "びっくり", troubled: "考え中" };
async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`/api/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(65000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "処理できませんでした。もう一度試してください。");
  return data as T;
}
function Cup({ className = "" }: { className?: string }) {
  return <svg className={className} width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M6 13h17v7a7 7 0 0 1-7 7h-3a7 7 0 0 1-7-7v-7ZM23 14h2a4 4 0 0 1 0 8h-3M10 3c-3 3 3 4 0 7M17 3c-3 3 3 4 0 7M4 29h22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}
function PersonaReview({ content }: { content: PersonaContent }) {
  return <div className="persona-review">
    {[content.personality, content.communication, content.conflictBehavior].map((group, index) => <dl key={index} className="traits">{Object.entries(group).map(([key, value]) => <div key={key}><dt>{labels[key] || key}</dt><dd>{value === null || (Array.isArray(value) && !value.length) ? "まだ分からない" : Array.isArray(value) ? value.join("・") : typeof value === "boolean" ? value ? "はい" : "いいえ" : value}</dd></div>)}</dl>)}
    <h3>承認する会話の実例</h3>
    <p className="muted small">名前・住所・秘密が残っていないか、一つずつ確認してください。</p>
    {content.behaviorExamples.map((example, i) => <blockquote className="example" key={i}><span className="eyebrow">SITUATION {i + 1}</span><p>{example.situation}</p><strong>「{example.response}」</strong><small>{example.tendency}</small></blockquote>)}
  </div>;
}
export default function MasalaApp() {
  const [config, setConfig] = useState<Config | null>(null);
  const [view, setView] = useState<View>("home");
  const [adult, setAdult] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [question, setQuestion] = useState(interviewQuestions[0]);
  const [answer, setAnswer] = useState("");
  const [review, setReview] = useState<string | null>(null);
  const [sendConsent, setSendConsent] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [proposal, setProposal] = useState<Draft | null>(null);
  const [scenario, setScenario] = useState(0);
  const [calibration, setCalibration] = useState<Dialogue | null>(null);
  const [ratings, setRatings] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState("");
  const [feedbackConsent, setFeedbackConsent] = useState(false);
  const [finalConsent, setFinalConsent] = useState(false);
  const [personaId, setPersonaId] = useState("");
  const [personaIds, setPersonaIds] = useState<string[]>([]);
  const [game, setGame] = useState<PublicGame | null>(null);
  const [partner, setPartner] = useState("Asha");
  const [message, setMessage] = useState("");
  const [dateResult, setDateResult] = useState("");
  const [matchId, setMatchId] = useState("");
  const [matchPersonaId, setMatchPersonaId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => { fetch("/api/config").then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setConfig(data); }).catch(() => setError("設定を読み込めません。ページを再読み込みしてください。")); }, []);
  useEffect(() => { fetch("/api/session").then(async response => { if (!response.ok) return; const data = await response.json() as { ready: boolean; personaIds: string[] }; if (data.ready) { setReady(true); setAdult(true); setPersonaIds(data.personaIds); setPersonaId(data.personaIds[0] || ""); } }).catch(() => {}); }, []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [game?.messages, busy]);
  useEffect(() => { if (privacy) dialogRef.current?.showModal(); else dialogRef.current?.close(); }, [privacy]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [view]);

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError("");
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "処理を完了できませんでした。"); }
    finally { setBusy(false); }
  }
  async function session() {
    if (!adult) throw new Error("18歳以上であることを確認してください。");
    if (!ready) { await post("session", { adultConfirmed: true }); setReady(true); }
  }
  function resetInterview() {
    setAnswers([]); setSkipped(0); setQuestion(interviewQuestions[0]); setAnswer(""); setReview(null); setSendConsent(false);
    setDraft(null); setProposal(null); setRatings({}); setCalibration(null); setFeedback(""); setFinalConsent(false);
  }
  function startInterview() { void run(async () => { await session(); resetInterview(); setView("interview"); }); }
  function startGame(target: string, name: string) { void run(async () => {
    await session();
    const next = await post<PublicGame>("game/start", { matchId: config?.demoMode ? "demo-match" : matchId, agentPersonaId: target });
    setGame(next); setPartner(name); setDateResult(""); setMessage(""); setView("game");
  }); }
  async function answerQuestion() {
    if (!review?.trim() || !sendConsent) return;
    const updated = [...answers, { question, summary: review.trim() }];
    await run(async () => {
      const next = await post<{ question: string }>("interview/next", { answers: updated, skipped, sendApproved: true });
      setAnswers(updated); setAnswer(""); setReview(null); setSendConsent(false); setQuestion(next.question);
    });
  }
  function finishInterview() { void run(async () => {
    const next = await post<Draft>("persona/extract", { answers, sendApproved: true });
    setDraft(next); setView("calibrate"); setScenario(0); setCalibration(null);
  }); }
  function testScenario() { if (draft) void run(async () => {
    setCalibration(await post<Dialogue>("persona/calibrate", { draftId: draft.draftId, scenario }));
  }); }
  function revise() { if (draft && feedback.trim() && feedbackConsent) void run(async () => {
    setProposal(await post<Draft>("persona/revise", { draftId: draft.draftId, feedback, sendApproved: true }));
  }); }
  function approve() { if (draft && finalConsent) void run(async () => {
    const result = await post<{ personaId: string }>("persona/approve", { draftId: draft.draftId, simulationApproved: true, examplesApproved: true, adultConfirmed: true });
    setPersonaId(result.personaId); setPersonaIds(current => [result.personaId, ...current]); setView("approved"); setDraft(null); setProposal(null); setAnswers([]); setFeedback("");
  }); }
  function revoke() { if (personaId) void run(async () => {
    await post("persona/revoke", { personaId }); const remaining = personaIds.filter(id => id !== personaId); setPersonaIds(remaining); setPersonaId(remaining[0] || ""); setGame(null); setView("home"); setDateResult("利用同意を撤回しました。このPersonaを使った以後の会話は停止されます。");
  }); }
  async function sendMessage() {
    if (!game || !message.trim()) return;
    const currentMessage = message;
    await run(async () => {
      const result = await post<{ game: PublicGame; reply: Dialogue }>("game/message", { gameId: game.id, message: currentMessage });
      setGame(result.game); setMessage("");
    });
  }
  const provider = config?.provider || "読み込み中";
  const scene = game ? scenes[game.scene] : scenes[0];

  return <div className="app-frame">
    <header className="site-header l--flex -ai:center -jc:between">
      <button className="brand" aria-label="ホームに戻る" disabled={busy} onClick={() => { setView("home"); setError(""); }}><Cup/><span>love match<b>MASALA<span className="brand-dot">✳</span></b></span></button>
      <nav className="header-nav l--cluster -g:20" aria-label="メインナビゲーション"><button className={view === "game" || view === "home" ? "nav-active" : ""} disabled={busy} onClick={() => setView(game ? "game" : "home")}>デートを体験</button><button disabled={busy || !adult} onClick={startInterview}>自分のAIをつくる</button><button onClick={() => setPrivacy(true)}>プライバシー <span>↗</span></button></nav>
      <span className="header-note"><i/> MADE WITH CHAI & CURIOSITY</span>
    </header>
    <main>
      {error && <div className="alert" role="alert"><span>{error}</span><button aria-label="エラーを閉じる" onClick={() => setError("")}>×</button></div>}
      {view === "home" && <>
        <section className="hero">
          <div className="hero-copy l--stack -g:20">
            <span className="location"><span>✳</span> MUMBAI, INDIA <span className="location-line"/> A NEW KIND OF MEET-CUTE</span>
            <h1>A little chai.<br/>A little<br/><em>chemistry.</em></h1>
            <p className="hero-jp">あなたらしさから、はじまる会話。</p>
            <p className="hero-description">相手を知るって、きっと一杯のチャイに似ている。<br className="desktop-break"/>ゆっくり話して、少しずつ見つける、ふたりのスパイス。</p>
            <label className="check adult-check"><input type="checkbox" checked={adult} onChange={e => setAdult(e.target.checked)}/>私は18歳以上で、AIとのシミュレーションであることを理解しています。</label>
            <div className="hero-actions l--cluster -g:15"><button className="button primary" disabled={busy || !adult || !config || !config.demoMode} onClick={() => startGame("demo-calm", "Asha")}>チャイデートを始める <span>↗</span></button><button className="button text-button" disabled={busy || !adult || !config} onClick={startInterview}>自分のAIをつくる <span>→</span></button></div>
            <p className="trust-note"><span>♧</span> 本人の承認から生まれるAI。秘密は、あなたのもの。</p>
          </div>
          <div className="hero-art"><img src="/chai-date.png" alt="ムンバイのカフェでチャイを手にする成人のオリジナルアニメキャラクター"/><span className="art-corner">THE FIRST CHAI DATE</span><div className="art-caption"><span className="sun-mark">✺</span><div><p>Some connections<br/>start with a conversation.</p><span>ひとつの会話が、きっかけになる。</span></div></div><span className="art-stamp">LET IT<br/><b>brew.</b><span>♡</span></span></div>
        </section>
        <section className="journey-strip"><span className="eyebrow">LESS SWIPING.<br/>MORE CONNECTING.</span><div><span>01</span><p>Tell your story<small>会話から、あなたらしさを。</small></p></div><div><span>02</span><p>Make it yours<small>自分で確かめ、整える。</small></p></div><div><span>03</span><p>See what brews<small>自由に話して、違いを楽しむ。</small></p></div></section>
        <section className="meet-section"><div className="section-heading"><div><p className="eyebrow">TWO PERSONALITIES. YOUR CONVERSATION.</p><h2>まずは、会ってみよう。</h2></div><p className="muted small">{config?.demoMode ? "架空の成人Persona・実際の相手ではありません" : "認証済みのマッチから開始してください"}<br/>{provider}</p></div>
          {config?.demoMode ? <div className="persona-cards">{[{ id: "demo-calm", name: "Asha", label: "THE THOUGHTFUL ONE", desc: "静かな場所と、ゆっくり深まる会話が好き。", tags: ["穏やか", "思慮深い", "ゆっくり"] }, { id: "demo-playful", name: "Mira", label: "THE SPONTANEOUS ONE", desc: "冗談と、予定になかった小さな冒険が好き。", tags: ["遊び心", "好奇心", "自然体"] }].map((p, i) => <article className={`persona-card persona-${i}`} key={p.id}><div className="portrait-small"><img src="/chai-date.png" alt="架空の成人キャラクター。デモ2名は同じイラストを使用"/></div><div><p className="eyebrow">{p.label}</p><h3>{p.name} <small>27 · DEMO</small></h3><p>{p.desc}</p><div className="tags">{p.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div><button className="round-button" aria-label={`${p.name}と話す`} disabled={busy || !adult} onClick={() => startGame(p.id, p.name)}>↗</button></article>)}</div> : <div className="panel l--stack -g:15"><p>PSI連携元で本人確認を済ませ、マッチ情報を入力してください。</p><label>Match ID<input value={matchId} onChange={e => setMatchId(e.target.value)}/></label><label>Agent Persona ID<input value={matchPersonaId} onChange={e => setMatchPersonaId(e.target.value)}/></label><button className="button primary" disabled={!adult || busy || !matchId || !matchPersonaId} onClick={() => startGame(matchPersonaId, "Match")}>マッチしたAIと話す</button></div>}
          {personaId && <div className="owned-persona"><label>あなたの承認済みPersona <select aria-label="承認済みPersonaを選ぶ" value={personaId} onChange={e => setPersonaId(e.target.value)} disabled={busy}>{personaIds.map((id, i) => <option value={id} key={id}>Persona {personaIds.length - i}</option>)}</select></label>{config?.demoMode && <button className="link-button" disabled={busy} onClick={() => startGame(personaId, "Your AI")}>自分のAIと話す →</button>}<button className="link-button danger" disabled={busy} onClick={revoke}>利用同意を撤回</button></div>}
          {dateResult && <p className="notice" role="status">{dateResult}</p>}
        </section>
      </>}

      {view === "interview" && <section className="workspace">
        <div className="workspace-heading"><p className="eyebrow">01 / GETTING TO KNOW YOU</p><h2>あなたの言葉で、<em>あなたらしく。</em></h2><p className="muted">正解はありません。会話するときの、いつものあなたを教えてください。</p></div>
        <div className="interview-grid"><aside className="sidebar l--stack -g:20"><Cup/><h3>A little conversation.</h3><p>5〜7問が目安です。答えにくい質問はスキップできます。</p><div className="progress-label"><span>承認した回答</span><b>{answers.length} / 6</b></div><progress value={Math.min(answers.length, 6)} max={6}/><p className="small muted">送信先：{provider}<br/>入力は送信前に確認・編集できます。氏名・連絡先・住所などは含めないでください。生回答全文は保存しません。</p><button className="link-button" onClick={() => setPrivacy(true)}>情報の扱いを確認 →</button></aside>
        <div className="panel interview-panel l--stack -g:20">
          <div className="approved-history">{answers.map((a, i) => <div className="history-answer" key={i}><span>✓ 回答 {i + 1} · 承認済み</span><p>{a.summary}</p></div>)}</div>
          <div className="interviewer-message"><span className="mini-avatar"><Cup/></span><div><span className="eyebrow">AI INTERVIEWER</span><p>{question}</p></div></div>
          {review === null ? <><label className="field-label" htmlFor="answer">個人情報を除いた回答・要約</label><textarea id="answer" rows={4} maxLength={1200} placeholder="たとえば、最初は少し緊張するけれど…" value={answer} onChange={e => setAnswer(e.target.value)} disabled={busy}/><div className="l--flex -jc:between -ai:center"><span className="small muted">{answer.length} / 1200 · まだ送信されていません</span><button className="button primary" disabled={busy || !answer.trim() || answers.length >= 12} onClick={() => { setReview(answer); setSendConsent(false); }}>送信内容を確認 →</button></div></> : <div className="review-send l--stack -g:15"><p className="eyebrow">REVIEW BEFORE SENDING</p><label htmlFor="review-answer">送信する文章（編集できます）</label><textarea id="review-answer" rows={4} value={review} maxLength={1200} onChange={e => { setReview(e.target.value); setSendConsent(false); }}/><p className="small muted">この文章と、これまで承認した要約を{provider}へ送ります。OpenAI利用時は同社が処理します。</p><label className="check"><input type="checkbox" checked={sendConsent} onChange={e => setSendConsent(e.target.checked)}/>個人情報を確認し、この内容の送信を承認します。</label><div className="l--cluster -g:15"><button className="button primary" disabled={busy || !sendConsent || !review.trim()} onClick={() => void answerQuestion()}>承認して送信 →</button><button className="link-button" disabled={busy} onClick={() => setReview(null)}>入力に戻る</button></div></div>}
          <div className="interview-controls"><button className="link-button" disabled={busy || skipped >= 12} onClick={() => void run(async () => { const count = skipped + 1; const next = await post<{ question: string }>("interview/next", { answers, skipped: count, sendApproved: true }); setSkipped(count); setQuestion(next.question); setAnswer(""); setReview(null); })}>この質問をスキップ</button><button className="button secondary" disabled={busy || !answers.length} onClick={finishInterview}>Finish Interview · Personaをつくる →</button></div>
          {busy && <p className="typing" role="status">会話を考えています<span>● ● ●</span></p>}
        </div></div>
      </section>}

      {view === "calibrate" && draft && <section className="workspace">
        <div className="workspace-heading"><p className="eyebrow">02 / MAKE IT FEEL LIKE YOU</p><h2>「自分らしい」を、<em>確かめよう。</em></h2><p className="muted">この下書きはあなただけが確認できます。公開・利用前に、実際の返答を試してください。</p></div>
        <div className="calibration-grid"><div className="panel l--stack -g:20"><p className="eyebrow">YOUR PRIVATE PERSONA</p><PersonaReview content={draft.content}/></div><div className="l--stack -g:20"><div className="panel l--stack -g:15"><p className="eyebrow">SELF-CALIBRATION</p><h3>こんなとき、どう答える？</h3><div className="scenario-tabs">{scenarios.map((_, i) => <button className={scenario === i ? "selected" : ""} key={i} disabled={busy} onClick={() => { setScenario(i); setCalibration(null); }}>状況 {i + 1}{ratings[i] ? " ✓" : ""}</button>)}</div><p className="scenario-text">{scenarios[scenario]}</p><button className="button secondary" disabled={busy} onClick={testScenario}>AIの返答を試す ↗</button>{calibration && <><blockquote className="calibration-reply">{calibration.dialogue}</blockquote><div className="l--cluster -g:15"><button className={`rating ${ratings[scenario] === "yes" ? "selected" : ""}`} onClick={() => setRatings({ ...ratings, [scenario]: "yes" })}>♡ 自分らしい</button><button className={`rating ${ratings[scenario] === "no" ? "selected" : ""}`} onClick={() => setRatings({ ...ratings, [scenario]: "no" })}>↺ 自分らしくない</button></div></>}
          <label className="field-label" htmlFor="feedback">違うと感じたところを教えてください</label><textarea id="feedback" rows={3} value={feedback} maxLength={1200} onChange={e => { setFeedback(e.target.value); setFeedbackConsent(false); }} placeholder="私は大人数のパーティーより、静かなカフェが好きです。"/><p className="small muted">このフィードバックと下書きを{provider}が処理し、修正案を作ります。</p><label className="check"><input type="checkbox" checked={feedbackConsent} onChange={e => setFeedbackConsent(e.target.checked)}/>個人情報を除き、この内容の送信を承認します。</label><button className="button secondary" disabled={busy || !feedback.trim() || !feedbackConsent || !!proposal} onClick={revise}>修正案をつくる →</button>
          </div><div className="panel approval-panel l--stack -g:15"><p className="eyebrow">YOUR APPROVAL MATTERS</p><label className="check"><input type="checkbox" checked={finalConsent} onChange={e => setFinalConsent(e.target.checked)}/>Personaと会話例を確認しました。私の承認した会話傾向をAIシミュレーションとその推論に利用することに同意します。</label><p className="small muted">同意は後から撤回できます。AIは本人そのものではなく、実際の感情・行動を予測するものでもありません。</p><button className="button primary" disabled={busy || !finalConsent || !!proposal || Object.keys(ratings).length < 1} onClick={approve}>Final Approve · 承認して保存 ♡</button>{!Object.keys(ratings).length && <p className="small muted">少なくとも1つの状況で返答を試し、評価してください。</p>}</div>{busy && <p className="typing" role="status">AIが考えています<span>● ● ●</span></p>}</div></div>
        {proposal && <div className="proposal-panel panel"><p className="eyebrow">REVIEW THE CHANGES</p><h3>修正前と修正案を見比べる</h3><div className="diff-grid"><div><h4>変更前</h4><PersonaReview content={draft.content}/></div><div><h4>修正案</h4><PersonaReview content={proposal.content}/></div></div><div className="l--cluster -g:15"><button className="button primary" disabled={busy} onClick={() => { setDraft(proposal); setProposal(null); setFinalConsent(false); setCalibration(null); setRatings({}); setFeedback(""); setFeedbackConsent(false); }}>この変更を承認する ✓</button><button className="button secondary" disabled={busy} onClick={() => setProposal(null)}>採用しない</button></div></div>}
      </section>}

      {view === "approved" && <section className="success-page l--stack -g:20"><span className="success-mark">♡</span><p className="eyebrow">APPROVED BY YOU</p><h2>あなたらしさに、<br/><em>ひとさじのスパイス。</em></h2><p>Personaを暗号化して保存しました。<br/>承認した会話の傾向だけを、シミュレーションに使います。</p><div className="l--cluster -g:15">{config?.demoMode && <button className="button primary" disabled={busy} onClick={() => startGame(personaId, "Your AI")}>自分のAIと話してみる →</button>}<button className="button secondary" onClick={() => setView("home")}>ホームへ</button></div><button className="link-button danger" disabled={busy} onClick={revoke}>利用同意を撤回する</button></section>}

      {view === "game" && game && <section className="game-workspace">
        <div className="game-heading"><div><p className="eyebrow">A CONVERSATION, NOT A PREDICTION</p><h2>{scene.title}<em> · {partner}</em></h2></div><div className="scene-dots">{scenes.map((s, i) => <span className={i === game.scene ? "current" : i < game.scene ? "done" : ""} key={s.id}>{String(i + 1).padStart(2, "0")} <small>{s.title}</small></span>)}</div></div>
        <div className="game-grid"><div className={`date-stage emotion-${game.emotion} ${game.scene === 1 ? "rainy" : ""}`}><img src="/chai-date.png" alt={`${partner}との架空のチャイデート。成人キャラクターの共通イラスト`}/><span className="stage-location">⌖ MUMBAI · CHAI CAFÉ</span><span className="emotion-chip">{emotionLabels[game.emotion]} {game.emotion === "happy" ? "♡" : game.emotion === "surprised" ? "!" : "✳"}</span>{game.scene === 1 && <div className="rain-overlay" aria-hidden="true"/>}<div className="scene-caption"><span className="eyebrow">SCENE {game.scene + 1} / 3</span><h3>{scene.subtitle}</h3><p>{scene.description}</p></div></div>
        <div className="conversation-panel"><div className="conversation-header"><div className="partner-online"><i/><strong>{partner}</strong><span>AI SIMULATION</span></div><span className="small muted">{Math.min(game.sceneTurns, 3)} / 3 turns</span></div><p className="simulation-notice">{config?.demoMode ? "架空の成人Persona。" : "本人が承認した会話傾向を使うAI。"}本人の感情や恋愛の成功を予測するものではありません。</p><div className="messages" ref={scrollRef} role="log" aria-label="会話履歴" aria-live="polite">{!game.messages.length && <div className="chat-empty"><Cup/><p>一杯のチャイから、<br/>会話をはじめよう。</p><span>好きなこと、今日の気分。<br/>あなたの言葉で話しかけてみて。</span></div>}{game.messages.map((m, i) => <div className={`message message-${m.role}`} key={`${game.id}-${i}`}><span>{m.role === "user" ? "YOU" : partner.toUpperCase()}</span><p>{m.text}</p></div>)}{busy && <div className="message message-assistant typing" role="status">考えています<span>● ● ●</span></div>}</div>
        {game.completed ? <div className="game-complete l--stack -g:15"><p>♡ 今日の会話は、ここまで。</p><p className="small muted">もっと話してみたい気持ちを、次の一歩に。</p><button className="button primary" disabled={busy || !!dateResult} onClick={() => void run(async () => { const result = await post<{ message: string }>("date-request", { gameId: game.id }); setDateResult(result.message); })}>Request Real Date ↗</button>{dateResult && <p className="notice small" role="status">{dateResult}</p>}</div> : <form className="composer" onSubmit={e => { e.preventDefault(); void sendMessage(); }}><label className="sr-only" htmlFor="game-message">メッセージ</label><textarea id="game-message" value={message} onChange={e => setMessage(e.target.value)} rows={2} maxLength={1200} placeholder="あなたの言葉で話してみよう…" disabled={busy}/><button type="submit" className="send-button" aria-label="メッセージを送る" disabled={busy || !message.trim()}>↗</button><span>{message.length} / 1200 · {provider}</span></form>}
        </div></div><div className="game-bottom"><span>✳ EVENT · {game.event === "rain" ? "突然のモンスーン" : game.event === "repair" ? "もう一度、伝えてみる" : game.event === "personality_difference" ? "好みの違いを発見" : "ふたりの会話"}</span><div className="l--cluster -g:20"><button className="link-button" disabled={busy} onClick={() => void run(async () => { setGame(await post<PublicGame>("game/retry", { gameId: game.id })); setDateResult(""); })}>↺ このシーンをRetry</button>{personaId && <button className="link-button danger" disabled={busy} onClick={revoke}>自分のPersonaの同意を撤回</button>}</div></div>
      </section>}
    </main>
    <footer className="site-footer"><p><span>✳</span> LOVE MATCH MASALA <small>JAPAN MEETS INDIA. YOU MEET POSSIBILITY.</small></p><span>Made for meaningful conversations.</span><button className="link-button" onClick={() => setPrivacy(true)}>Your privacy, always. ↗</button></footer>
    <dialog className="privacy-dialog" ref={dialogRef} onCancel={() => setPrivacy(false)} onClose={() => setPrivacy(false)}><div className="l--stack -g:20"><div className="l--flex -jc:between -ai:center"><p className="eyebrow">YOUR PRIVACY, ALWAYS</p><button className="round-button" aria-label="プライバシー説明を閉じる" onClick={() => setPrivacy(false)}>×</button></div><h2>秘密は、<em>あなたのもの。</em></h2><p>自由回答は送信前に確認・編集できます。承認した回答要約、Persona、会話例、校正フィードバックだけを推論に使います。</p><p>現在の処理先：<strong>{provider}</strong>。OpenAI利用時、送信した内容は同社が処理します。ゲームの発言も会話の生成に送信されます。</p><p>生の回答全文は永続保存しません。承認済みPersonaはAES-256-GCMで保存時に暗号化します。推論時の内容をLLM事業者から隠す仕組みではありません。</p><p>プレイヤーにPersonaのJSONや本人の生プロフィールを送信しません。ただし、繰り返しの会話から特徴が推測される可能性はあります。</p><p>利用同意は承認後の画面から撤回できます。双方の承認前に連絡先を公開しません。</p><p className="small muted">このMVPのデモはブラウザーのセッションを本人操作の識別に使います。ブラウザーを変えたりセッションが切れると、デモで作ったPersonaの操作を継続できない場合があります。架空の回答で試してください。</p><button className="button primary" onClick={() => setPrivacy(false)}>確認しました</button></div></dialog>
  </div>;
}
