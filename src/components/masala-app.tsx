"use client";
import { useEffect, useRef, useState } from "react";
import { scenes, type Message } from "@/lib/game";
import { interviewQuestions, scenarios, type Answer, type Dialogue, type PersonaContent } from "@/lib/schemas";
import { readLocale, translate, type Locale } from "@/lib/i18n";
import { INTERVIEW_LIMIT, interviewOptions, interviewProgress, type InterviewNext } from "@/lib/interview";
type Config = {
    demoMode: boolean;
    llmMode: "demo" | "openai";
    provider: string;
};
type Draft = {
    draftId: string;
    content: PersonaContent;
};
type PublicGame = {
    id: string;
    scene: number;
    sceneTurns: number;
    completed: boolean;
    messages: Message[];
    emotion: Dialogue["emotion"];
    event: string;
};
type View = "home" | "interview" | "calibrate" | "approved" | "game";
const labels: Record<string, string> = { socialStyle: "会話のスタイル", humor: "ユーモア", values: "大切にすること", relationshipPace: "関係のペース", tone: "話し方", sentenceLength: "文章の長さ", asksFollowUpQuestions: "自然に質問する", handlesSilence: "沈黙への対応", initialReaction: "意見が違ったとき", repairStyle: "すれ違いの解き方" };
const emotionLabels = { neutral: "穏やか", happy: "うれしい", shy: "少し照れている", surprised: "びっくり", troubled: "考え中" };
async function postRequest<T>(path: string, body: unknown, locale: Locale): Promise<T> {
    const response = await fetch(`/api/${path}`, { method: "POST", headers: { "Content-Type": "application/json", "X-Masala-Language": locale }, body: JSON.stringify(body), signal: AbortSignal.timeout(65000) });
    const data = await response.json();
    if (!response.ok)
        throw new Error(data.error || translate(locale, "処理できませんでした。もう一度試してください。"));
    return data as T;
}
function Cup({ className = "" }: {
    className?: string;
}) {
    return <svg className={className} width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M6 13h17v7a7 7 0 0 1-7 7h-3a7 7 0 0 1-7-7v-7ZM23 14h2a4 4 0 0 1 0 8h-3M10 3c-3 3 3 4 0 7M17 3c-3 3 3 4 0 7M4 29h22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}
function PersonaReview({ content, locale }: {
    content: PersonaContent;
    locale: Locale;
}) {
    const t = (text: string) => translate(locale, text);
    return <div className="persona-review">
    {[content.personality, content.communication, content.conflictBehavior].map((group, index) => <dl key={index} className="traits">{Object.entries(group).map(([key, value]) => <div key={key}><dt>{t(labels[key] || key)}</dt><dd>{value === null || (Array.isArray(value) && !value.length) ? t("まだ分からない") : Array.isArray(value) ? value.join(t("・")) : typeof value === "boolean" ? value ? t("はい") : t("いいえ") : value}</dd></div>)}</dl>)}
    <h3>{t("承認する会話の実例")}</h3>
    <p className="muted small">{t("名前・住所・秘密が残っていないか、一つずつ確認してください。")}</p>
    {content.behaviorExamples.map((example, i) => <blockquote className="example" key={i}><span className="eyebrow">SITUATION {i + 1}</span><p>{example.situation}</p><strong>「{example.response}」</strong><small>{example.tendency}</small></blockquote>)}
  </div>;
}
export default function MasalaApp() {
    const [locale, setLocale] = useState<Locale>("ja");
    const t = (text: string) => translate(locale, text);
    const post = <T,>(path: string, body: unknown) => postRequest<T>(path, body, locale);
    const [config, setConfig] = useState<Config | null>(null);
    const [view, setView] = useState<View>("home");
    const [adult, setAdult] = useState(false);
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [privacy, setPrivacy] = useState(false);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [skipped, setSkipped] = useState(0);
    const interview = interviewProgress(answers.length, skipped);
    const [question, setQuestion] = useState(interviewQuestions[0]);
    const [options, setOptions] = useState<string[]>([...interviewOptions[0]]);
    const [choice, setChoice] = useState<number | "other" | null>(null);
    const [answer, setAnswer] = useState("");
    const [draft, setDraft] = useState<Draft | null>(null);
    const [proposal, setProposal] = useState<Draft | null>(null);
    const [scenario, setScenario] = useState(0);
    const [calibration, setCalibration] = useState<Dialogue | null>(null);
    const [ratings, setRatings] = useState<Record<number, string>>({});
    const [feedback, setFeedback] = useState("");
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
    const messageRef = useRef<HTMLTextAreaElement>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        try { setLocale(readLocale(localStorage.getItem("masala-language"))); } catch { /* Storage may be disabled. */ }
    }, []);
    useEffect(() => { document.documentElement.lang = locale; }, [locale]);
    function changeLocale(next: Locale) {
        setLocale(next);
        try { localStorage.setItem("masala-language", next); } catch { /* Keep the in-memory preference. */ }
    }
    useEffect(() => { fetch("/api/config").then(async (response) => { const data = await response.json(); if (!response.ok)
        throw new Error(data.error); setConfig(data); }).catch(() => setError(t("設定を読み込めません。ページを再読み込みしてください。"))); }, []);
    useEffect(() => { fetch("/api/session").then(async (response) => { if (!response.ok)
        return; const data = await response.json() as {
        ready: boolean;
        personaIds: string[];
    }; if (data.ready) {
        setReady(true);
        setAdult(true);
        setPersonaIds(data.personaIds);
        setPersonaId(data.personaIds[0] || "");
    } }).catch(() => { }); }, []);
    useEffect(() => { if (scrollRef.current)
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [game?.messages, busy]);
    useEffect(() => { if (privacy)
        dialogRef.current?.showModal();
    else
        dialogRef.current?.close(); }, [privacy]);
    useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [view]);
    async function run(action: () => Promise<void>) {
        if (busy)
            return;
        setBusy(true);
        setError("");
        try {
            await action();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : t("処理を完了できませんでした。"));
        }
        finally {
            setBusy(false);
        }
    }
    async function session() {
        if (!adult)
            throw new Error(t("18歳以上であることを確認してください。"));
        if (!ready) {
            await post("session", { adultConfirmed: true });
            setReady(true);
        }
    }
    function resetInterview() {
        setAnswers([]);
        setSkipped(0);
        setQuestion(interviewQuestions[0]);
        setOptions([...interviewOptions[0]]);
        setChoice(null);
        setAnswer("");
        setDraft(null);
        setProposal(null);
        setRatings({});
        setCalibration(null);
        setFeedback("");
        setFinalConsent(false);
    }
    function startInterview() { void run(async () => { await session(); resetInterview(); setView("interview"); }); }
    function startGame(target: string, name: string) {
        void run(async () => {
            await session();
            const next = await post<PublicGame>("game/start", { matchId: config?.demoMode ? "demo-match" : matchId, agentPersonaId: target });
            setGame(next);
            setPartner(name);
            setDateResult("");
            setMessage("");
            setView("game");
        });
    }
    async function answerQuestion() {
        if (!answer.trim() || interview.finished)
            return;
        const updated = [...answers, { question: t(question), summary: answer.trim() }];
        await run(async () => {
            const next = await post<InterviewNext>("interview/next", { answers: updated, skipped, sendApproved: true });
            setAnswers(updated);
            setAnswer("");
            setChoice(null);
            if (!next.completed) { setQuestion(next.question); setOptions(next.options); }
        });
    }
    function finishInterview() {
        void run(async () => {
            const next = await post<Draft>("persona/extract", { answers, sendApproved: true });
            setDraft(next);
            setView("calibrate");
            setScenario(0);
            setCalibration(null);
        });
    }
    function testScenario() {
        if (draft)
            void run(async () => {
                setCalibration(await post<Dialogue>("persona/calibrate", { draftId: draft.draftId, scenario }));
            });
    }
    function revise() {
        if (draft && feedback.trim())
            void run(async () => {
                setProposal(await post<Draft>("persona/revise", { draftId: draft.draftId, feedback, sendApproved: true }));
            });
    }
    function approve() {
        if (draft && finalConsent)
            void run(async () => {
                const result = await post<{
                    personaId: string;
                }>("persona/approve", { draftId: draft.draftId, simulationApproved: true, examplesApproved: true, adultConfirmed: true });
                setPersonaId(result.personaId);
                setPersonaIds(current => [result.personaId, ...current]);
                setView("approved");
                setDraft(null);
                setProposal(null);
                setAnswers([]);
                setFeedback("");
            });
    }
    function revoke() {
        if (personaId)
            void run(async () => {
                await post("persona/revoke", { personaId });
                const remaining = personaIds.filter(id => id !== personaId);
                setPersonaIds(remaining);
                setPersonaId(remaining[0] || "");
                setGame(null);
                setView("home");
                setDateResult(t("利用同意を撤回しました。このPersonaを使った以後の会話は停止されます。"));
            });
    }
    async function sendMessage() {
        if (!game || !message.trim())
            return;
        const currentMessage = message;
        await run(async () => {
            const result = await post<{
                game: PublicGame;
                reply: Dialogue;
            }>("game/message", { gameId: game.id, message: currentMessage });
            setGame(result.game);
            setMessage("");
        });
    }
    const provider = !config ? t("読み込み中") : config.llmMode === "openai" ? "OpenAI API" : t("ローカルの定型応答（LLM未使用）");
    const scene = game ? scenes[game.scene] : scenes[0];
    return <div className="app-frame">
    <header className="site-header l--flex -ai:center -jc:between">
      <button className="brand" aria-label={t("ホームに戻る")} disabled={busy} onClick={() => { setView("home"); setError(""); }}><Cup /><span>love match<b>MASALA<span className="brand-dot">✳</span></b></span></button>
      <nav className="header-nav l--cluster -g:20" aria-label={t("メインナビゲーション")}><button className={view === "game" || view === "home" ? "nav-active" : ""} disabled={busy} onClick={() => setView(game ? "game" : "home")}>{t("デートを体験")}</button><button disabled={busy || !adult} onClick={startInterview}>{t("自分のAIをつくる")}</button><button onClick={() => setPrivacy(true)}>{t("プライバシー")}<span>↗</span></button></nav>
      <div className="header-tools"><span className="header-note"><i /> MADE WITH CHAI & CURIOSITY</span><div className="language-switch" role="group" aria-label="Language / 言語"><button type="button" lang="ja" aria-label="日本語" aria-pressed={locale === "ja"} disabled={busy} onClick={() => changeLocale("ja")}>JP</button><button type="button" lang="en" aria-label="English" aria-pressed={locale === "en"} disabled={busy} onClick={() => changeLocale("en")}>EN</button></div></div>
    </header>
    <main>
      {error && <div className="alert" role="alert"><span>{t(error)}</span><button aria-label={t("エラーを閉じる")} onClick={() => setError("")}>×</button></div>}
      {view === "home" && <>
        <section className="hero">
          <div className="hero-copy l--stack -g:20">
            <span className="location"><span>✳</span> MUMBAI, INDIA <span className="location-line"/> A NEW KIND OF MEET-CUTE</span>
            <h1>A little chai.<br />A little<br /><em>chemistry.</em></h1>
            <p className="hero-jp">{t("あなたらしさから、はじまる会話。")}</p>
            <p className="hero-description">{t("AIとのデートで、会話の相性を体験するゲームです。カフェ・突然の雨・すれ違いの3シーンを各3往復で進め、最後に「もっと話したいか」を振り返ります。")}</p><p className="small">{t("すぐ遊ぶなら「チャイデートを始める」へ。自分のAIの作成は任意です。")}</p>
            <label className="check adult-check"><input type="checkbox" checked={adult} onChange={e => setAdult(e.target.checked)}/>{t("私は18歳以上で、AIとのシミュレーションであることを理解しています。")}</label>
            <div className="hero-actions l--cluster -g:15"><button className="button primary" disabled={busy || !adult || !config || !config.demoMode} onClick={() => startGame("demo-calm", "Asha")}>{t("チャイデートを始める")}<span>↗</span></button><button className="button text-button" disabled={busy || !adult || !config} onClick={startInterview}>{t("自分のAIをつくる")}<span>→</span></button></div>
            <p className="trust-note"><span>♧</span>{t("本人の承認から生まれるAI。秘密は、あなたのもの。")}</p>
          </div>
          <div className="hero-art"><img src="/chai-date.png" alt={t("ムンバイのカフェでチャイを手にする成人のオリジナルアニメキャラクター")}/><span className="art-corner">THE FIRST CHAI DATE</span><div className="art-caption"><span className="sun-mark">✺</span><div><p>Some connections<br />start with a conversation.</p><span>{t("ひとつの会話が、きっかけになる。")}</span></div></div><span className="art-stamp">LET IT<br /><b>brew.</b><span>♡</span></span></div>
        </section>
        <section className="journey-strip"><span className="eyebrow">LESS SWIPING.<br />MORE CONNECTING.</span><div><span>01</span><p>Tell your story<small>{t("会話から、あなたらしさを。")}</small></p></div><div><span>02</span><p>Make it yours<small>{t("自分で確かめ、整える。")}</small></p></div><div><span>03</span><p>See what brews<small>{t("自由に話して、違いを楽しむ。")}</small></p></div></section>
        <section className="meet-section"><div className="section-heading"><div><p className="eyebrow">TWO PERSONALITIES. YOUR CONVERSATION.</p><h2>{t("まずは、会ってみよう。")}</h2></div><p className="muted small">{config?.demoMode ? t("架空の成人Persona・実際の相手ではありません") : t("認証済みのマッチから開始してください")}<br />{provider}</p></div>
          {config?.demoMode ? <div className="persona-cards">{[{ id: "demo-calm", name: "Asha", label: "THE THOUGHTFUL ONE", desc: t("静かな場所と、ゆっくり深まる会話が好き。"), tags: [t("穏やか"), t("思慮深い"), t("ゆっくり")] }, { id: "demo-playful", name: "Mira", label: "THE SPONTANEOUS ONE", desc: t("冗談と、予定になかった小さな冒険が好き。"), tags: [t("遊び心"), t("好奇心"), t("自然体")] }].map((p, i) => <article className={`persona-card persona-${i}`} key={p.id}><div className="portrait-small"><img src="/chai-date.png" alt={t("架空の成人キャラクター。デモ2名は同じイラストを使用")}/></div><div><p className="eyebrow">{p.label}</p><h3>{p.name} <small>27 · DEMO</small></h3><p>{p.desc}</p><div className="tags">{p.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div><button className="round-button" aria-label={locale === "en" ? `Talk to ${p.name}` : `${p.name}と話す`} disabled={busy || !adult} onClick={() => startGame(p.id, p.name)}>↗</button></article>)}</div> : <div className="panel l--stack -g:15"><p>{t("PSI連携元で本人確認を済ませ、マッチ情報を入力してください。")}</p><label>Match ID<input value={matchId} onChange={e => setMatchId(e.target.value)}/></label><label>Agent Persona ID<input value={matchPersonaId} onChange={e => setMatchPersonaId(e.target.value)}/></label><button className="button primary" disabled={!adult || busy || !matchId || !matchPersonaId} onClick={() => startGame(matchPersonaId, "Match")}>{t("マッチしたAIと話す")}</button></div>}
          {personaId && <div className="owned-persona"><label>{t("あなたの承認済みPersona")}<select aria-label={t("承認済みPersonaを選ぶ")} value={personaId} onChange={e => setPersonaId(e.target.value)} disabled={busy}>{personaIds.map((id, i) => <option value={id} key={id}>Persona {personaIds.length - i}</option>)}</select></label>{config?.demoMode && <button className="link-button" disabled={busy} onClick={() => startGame(personaId, "Your AI")}>{t("自分のAIと話す →")}</button>}<button className="link-button danger" disabled={busy} onClick={revoke}>{t("利用同意を撤回")}</button></div>}
          {dateResult && <p className="notice" role="status">{t(dateResult)}</p>}
        </section>
      </>}

      {view === "interview" && <section className="workspace">
        <div className="workspace-heading"><p className="eyebrow">01 / GETTING TO KNOW YOU</p><h2>{t("あなたの言葉で、")}<em>{t("あなたらしく。")}</em></h2><p className="muted">{t("正解はありません。会話するときの、いつものあなたを教えてください。")}</p></div>
        <div className="interview-grid"><aside className="sidebar l--stack -g:20"><Cup /><h3>A little conversation.</h3><p>{t("スキップを含めて最大6問で終了します。回答が1つあれば、途中でも次へ進めます。")}</p><div className="progress-label"><span>{t("質問の進み具合")}</span><b>{interview.completed} / {INTERVIEW_LIMIT}</b></div><progress aria-label={t("質問の進み具合")} value={interview.completed} max={INTERVIEW_LIMIT}/><p className="small">{t("送信した回答")}: {answers.length} · {t("スキップ")}: {skipped}</p><p className="small muted">{t("送信先：")}{provider}<br />{t("回答を送信すると、これまでの回答とともにAIが処理します。氏名・連絡先・住所は含めないでください。生回答全文は保存しません。")}</p><button className="link-button" onClick={() => setPrivacy(true)}>{t("情報の扱いを確認 →")}</button></aside>
        <div className="panel interview-panel l--stack -g:20">
          <div className="approved-history">{answers.map((a, i) => <div className="history-answer" key={i}><span>{t("回答")}{i + 1}{t("· 送信済み")}</span><p>{a.summary}</p></div>)}</div>
          <div className="notice"><strong>{t("自分のAIをつくる準備です")}</strong><p>{t("① 最大6問 → ② AIの返答を確認 → ③ 承認して保存。デート体験だけなら、回答は不要です。")}</p>{config?.demoMode && <button className="link-button" disabled={busy} onClick={() => startGame("demo-calm", "Asha")}>{t("質問をやめて、デートを体験 →")}</button>}</div>
          {interview.finished ? <div className="interview-finished l--stack -g:15" role="status"><h3>{t("質問はこれで終了です")}</h3><p>{answers.length ? t("送信した回答からAIの下書きを作ります。次は返答を1つ試して、自分らしさを確認しましょう。") : t("すべてスキップしました。AIを作るには、少なくとも1つの回答が必要です。")}</p>{answers.length ? <button className="button primary" disabled={busy} onClick={finishInterview}>{t("次へ：自分のAIを確認 →")}</button> : <button className="button secondary" disabled={busy} onClick={resetInterview}>{t("質問をやり直す")}</button>}</div> : <>
          <p className="eyebrow">{t("質問")} {interview.completed + 1} / {INTERVIEW_LIMIT}</p>
          <div className="interviewer-message"><span className="mini-avatar"><Cup /></span><div><span className="eyebrow">AI INTERVIEWER</span><p>{t(question)}</p></div></div>
          <fieldset className="answer-choices" disabled={busy}><legend>{t("回答を選んでください")}</legend>{options.map((option, index) => <label className={`answer-option ${choice === index ? "selected" : ""}`} key={`${question}-${index}`}><input type="radio" name="interview-answer" checked={choice === index} onChange={() => { setChoice(index); setAnswer(t(option)); }}/><span>{t(option)}</span></label>)}<label className={`answer-option ${choice === "other" ? "selected" : ""}`}><input type="radio" name="interview-answer" checked={choice === "other"} onChange={() => { setChoice("other"); setAnswer(""); }}/><span>{t("その他（自分の言葉で入力）")}</span></label></fieldset>
          {choice !== null && <><label className="field-label" htmlFor="answer">{t("回答（送信前に編集できます）")}</label><textarea id="answer" rows={3} maxLength={1200} placeholder={t("たとえば、最初は少し緊張するけれど…")} value={answer} onChange={e => setAnswer(e.target.value)} disabled={busy}/></>}
          <div className="l--flex -jc:between -ai:center"><span className="small muted">{answer.length}{t("/ 1200 · まだ送信されていません")}</span><button className="button primary" disabled={busy || !answer.trim()} onClick={() => void answerQuestion()}>{t("回答を送信して次へ →")}</button></div>
          <div className="interview-controls"><button className="link-button" disabled={busy || !!answer.trim()} onClick={() => void run(async () => { const count = skipped + 1; const next = await post<InterviewNext>("interview/next", { answers, skipped: count, sendApproved: true }); setSkipped(count); if (!next.completed) { setQuestion(next.question); setOptions(next.options); } setChoice(null); setAnswer(""); })}>{t("この質問をスキップ")}</button><button className="button secondary" disabled={busy || !answers.length || !!answer.trim()} onClick={finishInterview}>{t("ここまでの回答で次へ →")}</button></div>
          {(choice !== null) && <button className="link-button" disabled={busy} onClick={() => { setChoice(null); setAnswer(""); }}>{t("選択・入力を取り消す")}</button>}
          {(!!answer.trim()) && <p className="small muted">{t("送信するか、選択・入力を取り消すと、スキップ・途中終了できます。")}</p>}
          </>}
          {busy && <p className="typing" role="status">{t("会話を考えています")}<span>● ● ●</span></p>}
        </div></div>
      </section>}

      {view === "calibrate" && draft && <section className="workspace">
        <div className="workspace-heading"><p className="eyebrow">02 / MAKE IT FEEL LIKE YOU</p><h2>{t("「自分らしい」を、")}<em>{t("確かめよう。")}</em></h2><p className="muted">{t("下書きを読む → 返答を1つ試して評価 → 利用に同意して保存。違うと感じたら修正できます。")}</p></div>
        <div className="calibration-grid"><div className="panel l--stack -g:20"><p className="eyebrow">YOUR PRIVATE PERSONA</p><PersonaReview locale={locale} content={draft.content}/></div><div className="l--stack -g:20"><div className="panel l--stack -g:15"><p className="eyebrow">SELF-CALIBRATION</p><h3>{t("こんなとき、どう答える？")}</h3><div className="scenario-tabs">{scenarios.map((_, i) => <button className={scenario === i ? "selected" : ""} key={i} disabled={busy} onClick={() => { setScenario(i); setCalibration(null); }}>{t("状況")}{i + 1}{ratings[i] ? " ✓" : ""}</button>)}</div><p className="scenario-text">{t(scenarios[scenario])}</p><button className="button secondary" disabled={busy} onClick={testScenario}>{t("AIの返答を試す ↗")}</button>{calibration && <><blockquote className="calibration-reply">{calibration.dialogue}</blockquote><div className="l--cluster -g:15"><button className={`rating ${ratings[scenario] === "yes" ? "selected" : ""}`} onClick={() => setRatings({ ...ratings, [scenario]: "yes" })}>{t("♡ 自分らしい")}</button><button className={`rating ${ratings[scenario] === "no" ? "selected" : ""}`} onClick={() => setRatings({ ...ratings, [scenario]: "no" })}>{t("↺ 自分らしくない")}</button></div></>}
          <label className="field-label" htmlFor="feedback">{t("違うと感じたところを教えてください")}</label><textarea id="feedback" rows={3} value={feedback} maxLength={1200} onChange={e => { setFeedback(e.target.value); }} placeholder={t("私は大人数のパーティーより、静かなカフェが好きです。")}/><p className="small muted">{t("このフィードバックと下書きを")}{provider}{t("が処理し、修正案を作ります。")}</p><button className="button secondary" disabled={busy || !feedback.trim() || !!proposal} onClick={revise}>{t("フィードバックを送信して修正 →")}</button>
          </div><div className="panel approval-panel l--stack -g:15"><p className="eyebrow">YOUR APPROVAL MATTERS</p><label className="check"><input type="checkbox" checked={finalConsent} onChange={e => setFinalConsent(e.target.checked)}/>{t("Personaと会話例を確認しました。私の承認した会話傾向をAIシミュレーションとその推論に利用することに同意します。")}</label><p className="small muted">{t("同意は後から撤回できます。AIは本人そのものではなく、実際の感情・行動を予測するものでもありません。")}</p><button className="button primary" disabled={busy || !finalConsent || !!proposal || Object.keys(ratings).length < 1} onClick={approve}>{t("Final Approve \u00B7 承認して保存 ♡")}</button>{!Object.keys(ratings).length && <p className="small muted">{t("少なくとも1つの状況で返答を試し、評価してください。")}</p>}</div>{busy && <p className="typing" role="status">{t("AIが考えています")}<span>● ● ●</span></p>}</div></div>
        {proposal && <div className="proposal-panel panel"><p className="eyebrow">REVIEW THE CHANGES</p><h3>{t("修正前と修正案を見比べる")}</h3><div className="diff-grid"><div><h4>{t("変更前")}</h4><PersonaReview locale={locale} content={draft.content}/></div><div><h4>{t("修正案")}</h4><PersonaReview locale={locale} content={proposal.content}/></div></div><div className="l--cluster -g:15"><button className="button primary" disabled={busy} onClick={() => { setDraft(proposal); setProposal(null); setFinalConsent(false); setCalibration(null); setRatings({}); setFeedback(""); }}>{t("この変更を承認する ✓")}</button><button className="button secondary" disabled={busy} onClick={() => setProposal(null)}>{t("採用しない")}</button></div></div>}
      </section>}

      {view === "approved" && <section className="success-page l--stack -g:20"><span className="success-mark">♡</span><p className="eyebrow">APPROVED BY YOU</p><h2>{t("あなたらしさに、")}<br /><em>{t("ひとさじのスパイス。")}</em></h2><p>{t("Personaを暗号化して保存しました。")}<br />{t("承認した会話の傾向だけを、シミュレーションに使います。")}</p><div className="l--cluster -g:15">{config?.demoMode && <button className="button primary" disabled={busy} onClick={() => startGame(personaId, "Your AI")}>{t("自分のAIと話してみる →")}</button>}<button className="button secondary" onClick={() => setView("home")}>{t("ホームへ")}</button></div><button className="link-button danger" disabled={busy} onClick={revoke}>{t("利用同意を撤回する")}</button></section>}

      {view === "game" && game && <section className="game-workspace">
        <div className="game-objective" aria-live="polite"><div><strong>{game.completed ? t("3シーンの体験が完了しました") : t("今回の目標")}</strong><p>{game.completed ? t("会話のペースや好みの違いを振り返り、もっと話したいか考えてみましょう。") : t(["好きな過ごし方を話し、相手の好みを1つ聞いてみよう。", "突然の雨。自分の希望を伝え、ふたりの過ごし方を相談しよう。", "意見が違ったら理由を聞き、次に一緒にしたいことを提案しよう。"][game.scene])}</p></div><div><b>{game.messages.filter(m => m.role === "user").length} / 9</b><span>{t("往復で完了")}</span></div><p className="small">{t("3シーン × 3往復。最後に、会話を続けたいかを自分で選びます。")}</p></div>
        <div className="game-heading"><div><p className="eyebrow">A CONVERSATION, NOT A PREDICTION</p><h2>{scene.title}<em> · {partner}</em></h2></div><div className="scene-dots">{scenes.map((s, i) => <span className={i === game.scene ? "current" : i < game.scene ? "done" : ""} key={s.id}>{String(i + 1).padStart(2, "0")} <small>{s.title}</small></span>)}</div></div>
        {!game.completed && <div className="reply-suggestions"><p className="small"><strong>{t("返答例を選ぶ、または自分で入力")}</strong> · {t("選択後に編集して送信できます。")}</p><div className="l--cluster -g:15">{[
          ["私は静かなカフェで過ごすのが好き。あなたは？", "初めてで少し緊張するね。おすすめのチャイはある？", "最近、夢中になっていることを教えて。"],
          ["雨が落ち着くまで、ここでもう少し話さない？", "私は予定変更も楽しみたいな。あなたはどうしたい？", "もう一杯チャイを飲みながら、次の予定を考えよう。"],
          ["違う好みも面白いね。そう思う理由を聞いてもいい？", "私はゆっくり仲良くなりたい。あなたのペースは？", "次は、お互いが好きな場所を一つずつ選んでみない？"],
        ][game.scene].map(text => <button className="reply-option" key={text} disabled={busy} onClick={() => { setMessage(t(text)); messageRef.current?.focus(); }}>{t(text)}</button>)}<button className="link-button" disabled={busy} onClick={() => { setMessage(""); messageRef.current?.focus(); }}>{t("その他（自分の言葉で入力）")}</button></div></div>}
        <div className="game-grid"><div className={`date-stage emotion-${game.emotion} ${game.scene === 1 ? "rainy" : ""}`}><img src="/chai-date.png" alt={locale === "en" ? `A fictional chai date with ${partner}. Shared adult character illustration.` : `${partner}との架空のチャイデート。成人キャラクターの共通イラスト`}/><span className="stage-location">⌖ MUMBAI · CHAI CAFÉ</span><span className="emotion-chip">{t(emotionLabels[game.emotion])} {game.emotion === "happy" ? "♡" : game.emotion === "surprised" ? "!" : "✳"}</span>{game.scene === 1 && <div className="rain-overlay" aria-hidden="true"/>}<div className="scene-caption"><span className="eyebrow">SCENE {game.scene + 1} / 3</span><h3>{t(scene.subtitle)}</h3><p>{t(scene.description)}</p></div></div>
        <div className="conversation-panel"><div className="conversation-header"><div className="partner-online"><i /><strong>{partner}</strong><span>AI SIMULATION</span></div><span className="small muted">{Math.min(game.sceneTurns, 3)} / 3 turns</span></div><p className="simulation-notice">{config?.demoMode ? t("架空の成人Persona。") : t("本人が承認した会話傾向を使うAI。")}{t("本人の感情や恋愛の成功を予測するものではありません。")}</p><div className="messages" ref={scrollRef} role="log" aria-label={t("会話履歴")} aria-live="polite">{!game.messages.length && <div className="chat-empty"><Cup /><p>{t("一杯のチャイから、")}<br />{t("会話をはじめよう。")}</p><span>{t("好きなこと、今日の気分。")}<br />{t("あなたの言葉で話しかけてみて。")}</span></div>}{game.messages.map((m, i) => <div className={`message message-${m.role}`} key={`${game.id}-${i}`}><span>{m.role === "user" ? "YOU" : partner.toUpperCase()}</span><p>{m.text}</p></div>)}{busy && <div className="message message-assistant typing" role="status">{t("考えています")}<span>● ● ●</span></div>}</div>
        {game.completed ? <div className="game-complete l--stack -g:15"><p>{t("♡ 今日の会話は、ここまで。")}</p><p className="small muted">{config?.demoMode ? t("今回は架空の相手とのデモです。申請の流れを試すか、別の相手と話してみましょう。") : t("もっと話してみたい気持ちを、次の一歩に。")}</p><button className="button primary" disabled={busy || !!dateResult} onClick={() => void run(async () => { const result = await post<{
            message: string;
        }>("date-request", { gameId: game.id }); setDateResult(result.message); })}>{config?.demoMode ? t("デート申請を試す（デモ） ↗") : t("実際のデートを申請 ↗")}</button><button className="button secondary" disabled={busy} onClick={() => setView("home")}>{t("別の相手と話す・ホームへ")}</button>{dateResult && <p className="notice small" role="status">{t(dateResult)}</p>}</div> : <form className="composer" onSubmit={e => { e.preventDefault(); void sendMessage(); }}><label className="sr-only" htmlFor="game-message">{t("メッセージ")}</label><textarea ref={messageRef} id="game-message" value={message} onChange={e => setMessage(e.target.value)} rows={2} maxLength={1200} placeholder={t("あなたの言葉で話してみよう…")} disabled={busy}/><button type="submit" className="send-button" aria-label={t("メッセージを送る")} disabled={busy || !message.trim()}>↗</button><span>{message.length} / 1200 · {provider}</span></form>}
        </div></div><div className="game-bottom"><span>✳ EVENT · {game.event === "rain" ? t("突然のモンスーン") : game.event === "repair" ? t("もう一度、伝えてみる") : game.event === "personality_difference" ? t("好みの違いを発見") : t("ふたりの会話")}</span><div className="l--cluster -g:20"><button className="link-button" disabled={busy} onClick={() => void run(async () => { setGame(await post<PublicGame>("game/retry", { gameId: game.id })); setDateResult(""); })}>{t("↺ このシーンをRetry")}</button>{personaId && <button className="link-button danger" disabled={busy} onClick={revoke}>{t("自分のPersonaの同意を撤回")}</button>}</div></div>
      </section>}
    </main>
    <footer className="site-footer"><p><span>✳</span> LOVE MATCH MASALA <small>JAPAN MEETS INDIA. YOU MEET POSSIBILITY.</small></p><span>Made for meaningful conversations.</span><button className="link-button" onClick={() => setPrivacy(true)}>Your privacy, always. ↗</button></footer>
    <dialog className="privacy-dialog" ref={dialogRef} onCancel={() => setPrivacy(false)} onClose={() => setPrivacy(false)}><div className="l--stack -g:20"><div className="l--flex -jc:between -ai:center"><p className="eyebrow">YOUR PRIVACY, ALWAYS</p><button className="round-button" aria-label={t("プライバシー説明を閉じる")} onClick={() => setPrivacy(false)}>×</button></div><h2>{t("秘密は、")}<em>{t("あなたのもの。")}</em></h2><p>{t("回答・フィードバックは入力欄で編集し、送信ボタンで送れます。送信した回答、Persona、会話例、フィードバックをAIが処理します。完成したPersonaの利用には最終承認が必要です。")}</p><p>{t("現在の処理先：")}<strong>{provider}</strong>{t("。OpenAI利用時、送信した内容は同社が処理します。ゲームの発言も会話の生成に送信されます。")}</p><p>{t("生の回答全文は永続保存しません。承認済みPersonaはAES-256-GCMで保存時に暗号化します。推論時の内容をLLM事業者から隠す仕組みではありません。")}</p><p>{t("プレイヤーにPersonaのJSONや本人の生プロフィールを送信しません。ただし、繰り返しの会話から特徴が推測される可能性はあります。")}</p><p>{t("利用同意は承認後の画面から撤回できます。双方の承認前に連絡先を公開しません。")}</p><p className="small muted">{t("このMVPのデモはブラウザーのセッションを本人操作の識別に使います。ブラウザーを変えたりセッションが切れると、デモで作ったPersonaの操作を継続できない場合があります。架空の回答で試してください。")}</p><button className="button primary" onClick={() => setPrivacy(false)}>{t("確認しました")}</button></div></dialog>
  </div>;
}
