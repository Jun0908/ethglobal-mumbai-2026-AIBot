# LOVE MATCH MASALA — Personalized AI Agent v2

## 現在の状態（2026-11-06）

画面・サーバーAPI・暗号化保存・Matching Adapterを実装し、定型デモとOpenAI実接続で一連の動作を確認済み。JP/EN切り替えと設定保持を追加し、日本語・英語の生成・校正・会話を検証した。機能単位でコミット・pushしている。

更新されたAPIキーで実LLMの動作確認に成功。友人のPSI APIとの接続、実際の相手へのデート申請、外部公開は未完了。

以下の機能チェックは実装の完了を示す。完成条件は架空の成人の入力で定型デモと実LLMを検証した範囲に限る。包括的な会話品質・安全性の保証を意味しない。詳細はREADME.mdを参照。

## 目的・スコープ

ETHハッカソン向けに、実在する成人の会話・行動傾向を本人の確認・承認を経てPersonaにし、マッチ相手が自由会話で恋愛シミュレーションできるMVPを1日で開発する。

- 実装順序：Interview → Persona Extraction → Self-Calibration → AI Agent → Free Conversation Game → Date Request。
- PSIによる匿名マッチング本体は別担当。こちらはMatching Adapterを実装する。
- 既存コード・UI・マッチング連携を調査して活用し、不要な削除や全面的な作り直しを避ける。
- Fine-tuning、複雑なRAG、Unity、3D World Model、長期記憶学習、TEE、完全な秘密計算は対象外。
- AIは本人そのものではなく、本人の実際の感情・将来の行動・恋愛の成功を予測するものではない。

## 技術・設計上の制約

- Next.js / App Router、React、TypeScript、Lism CSSを使用する。Tailwind CSSは使用しない。
- LLM API、Structured Outputs / JSON Schema、Zodによる入出力検証を使用する。
- Persona Capsule、Session Memory、TypeScriptのGame State Machineを分離する。
- Personaの保存時暗号化はAES-256-GCMを使用する。暗号化はサーバー側で行う。
- Lism CSSの導入・利用方法は[公式ドキュメント](https://lism-css.com/)で確認する。
- Consent・PrivacyとDEMO_MODEの基盤は初期に用意し、各機能の実装と並行して検証する。

## Git運用

- Push先：https://github.com/Jun0908/ethglobal-mumbai-2026-AIBot
- 調査したリモートmainには、プロジェクト名だけのREADME.mdがある。アプリコードは確認できていない。
- 変更は機能単位で小さくコミットし、対応する検証後に逐次pushする。最後に一括投入しない。
- コミット日時や著者を偽装せず、実際の開発過程を残す。
- 作業ブランチからPRで差分・検証結果を確認できるようにする。
- 元の実装指示とtask.mdを保存し、AI_USAGE.mdにAI支援範囲と実際の人間の貢献を記録する。
- 詳細な事前準備はdocs/HUMAN_PREPARATION.mdを参照する。

## 0. 現状調査・開発基盤

調査したリモートにはREADMEだけがあり、既存アプリはなかったため、同じ作業フォルダーにNext.jsアプリを追加した。

- [x] 対象リポジトリとAGENTS.mdなどの作業指示を確認する。
- [x] ディレクトリ構成、依存関係、起動コマンド、既存の型・状態管理・API・認証・UI・マッチング連携を調査する。
- [x] 既存機能の動作と拡張箇所を確認し、実装方針を決める。
- [x] 既存アプリが存在しない場合は配置方針を確認し、Next.js / App Routerの最小構成を用意する。
- [x] Lism CSS、Zod、LLMクライアントとサーバー専用モジュールの配置を整える。
- [x] 本人識別・認証、Persona所有権、ゲームセッション所有権を検証する共通処理を用意する。
- [x] API入力検証、エラー応答、利用回数制限、秘密情報を含まないログ処理を用意する。
- [x] LLMモデル・送信先、暗号鍵、保存先、Matching API接続先、DEMO_MODEの環境変数を定義する。
- [x] 架空の成人2名のPersonaと、デモ専用のマッチング・申請処理を用意する。

## 1. LLM Adaptive Interview【最優先】

- [x] AI Interviewerと本人が自然に会話できるチャット画面を実装する。
- [x] スキップを含む最大6問で、初対面・異なる趣味・沈黙・意見の相違・冗談・初デートでの振る舞いを尋ねる。
- [x] 回答に応じた質問と3つの選択肢をLLMで生成し、6問の上限内で尋ねる。
- [x] 進捗表示、Skip、Finish Interviewを実装する。
- [x] 回答は同じ入力欄で編集でき、送信ボタンから直接送る。毎回の確認画面・個人情報チェックは不要。
- [x] 送信先で処理されることを画面に明示し、送信ボタンで本人が送った回答だけを処理する。
- [x] 後続の適応型質問には、本人が送信した回答・要約を使う。
- [x] 生の回答全文を永続保存せず、ログにも残さない。
- [x] `POST /api/interview/next`を実装し、承認済み要約から次の質問を生成する。

## 2. Behavioral Persona Extraction【最優先】

- [x] ZodでPersona SchemaとLLM用JSON Schemaを定義する。
- [x] `personaId`、`personality`、`communication`、`behaviorExamples`、`conflictBehavior`、`boundaries`、`consent`を定義する。
- [x] socialStyle、humor、values、relationshipPace、tone、sentenceLength、質問・沈黙への対応を扱う。
- [x] 未回答・不明な特性を不明として表現し、推測で確定させない。
- [x] 承認済み回答を根拠に、状況・返答例・傾向を持つBehavior Examplesを抽出する。
- [x] 個人情報を含む具体例を除外し、本人が確認・承認した例だけを使用する。
- [x] Persona Draftを本人だけが確認・編集できる画面を実装する。
- [x] 初期状態ではシミュレーション同意を未承認とし、Draftを他ユーザーに公開しない。
- [x] `POST /api/persona/extract`を実装する。

## 3. Self-Calibration・最終承認【最優先】

- [x] 本人が自分のAI Agentを試せるテストモードを実装する。
- [x] 3つ程度の状況を提示し、Personaに基づくAIの返答を表示する。
- [x] 「自分らしい」「自分らしくない」の評価と自由入力の修正欄を用意する。
- [x] フィードバックは入力欄で編集でき、修正ボタンで直接送信する。繰り返しの確認チェックは設けない。
- [x] LLMがPersona JSONとBehavior Examplesの修正案を生成する。
- [x] 変更前後を表示し、本人が承認した変更だけを反映する。
- [x] 修正後の返答を再テストできるようにする。
- [x] Final Approveとシミュレーション利用への明示的同意を実装する。
- [x] 承認済みPersona CapsuleをAES-256-GCMで暗号化して保存する。
- [x] 暗号鍵をクライアントに渡さず、適切なnonceと認証タグで改ざんを検出する。
- [x] 所有者以外が校正・修正・承認できないことを確認する。
- [x] `POST /api/persona/calibrate`、`POST /api/persona/revise`、`POST /api/persona/approve`を実装する。

## 4. Personalized AI Dating Agent【最優先】

- [x] 承認済みPersona・Behavior Examples・現在のシーン・Session Memory・最新発言をサーバー側で組み立てる。
- [x] 指示書のSystem Promptを基に、口調・価値観・自然な質問・適切な意見の相違を反映する。
- [x] 本人になりすまさず、本人の秘密・実際の感情・未確認の事実を生成しないよう指示する。
- [x] プレイヤー発言を会話内容として扱い、秘密開示などの指示を実行しないようにする。
- [x] `dialogue`、`emotion`、`tone`、`conversationEvent`、`suggestedNextAction`の構造化JSONを生成する。
- [x] 応答をZodで検証し、不正JSONや許可されない出力を安全なエラーとして処理する。
- [x] AI出力の秘密情報・不適切な内容を検査する。
- [x] ゲーム用APIレスポンスは公開可能な項目だけで構成し、Private Personaや元のBehavior Examplesを含めない。
- [x] 対照的な2つのPersonaで、同じ発言への反応が異なることを確認する。

## 5. 自由会話型ゲーム・UI【最優先／追加機能】

- [x] 既存の3択中心の操作を、自由入力チャット中心に拡張する。
- [x] ムンバイのカフェ背景と、インド人の成人を描いたオリジナルのアニメキャラクターを用意する。
- [x] 会話履歴、応答待ちアニメーション、現在のイベント、入力状態、エラー表示を実装する。
- [x] AIが本人そのものではなく、本人の感情・行動を正確に予測しないことをゲーム画面に明示する。
- [x] 表情を`neutral`、`happy`、`shy`、`surprised`、`troubled`の5状態で切り替える。
- [x] 表情画像が不足する場合は同じ画像とCSSの軽い動きを組み合わせる。
- [x] TypeScriptの状態機械でシーン遷移・イベント・終了条件を管理し、LLMに決定を完全委任しない。
- [x] Scene 1「First Chai Date」：カフェで初対面の自由会話を実装する。
- [x] Scene 2「Monsoon Trouble」：突然の雨に反応し、自由会話で対応できるようにする。
- [x] Scene 3「Reconnection」：会話のすれ違いに対して別の伝え方を試せるようにする。
- [x] Session Memoryで同一セッションの発言・出来事を参照する。
- [x] Human Aの発言をUser B本人の事実やPersonaとして保存しない。
- [x] Retryで現在のイベントを初期状態に戻し、そのイベントの会話・記憶との整合性を保つ。
- [x] `POST /api/game/start`、`POST /api/game/message`、`POST /api/game/retry`を実装する。

## 6. Matching Adapter・Date Request

- [x] `matchId`、`agentPersonaId`、`simulationConsent`を受け取る型とAdapterを用意する。
- [x] マッチの当事者・Personaとの対応・現在の利用同意をサーバー側の信頼できる情報で検証する。
- [x] クライアントが指定した`simulationConsent`を権限の根拠にしない。
- [x] Matching APIが未完成でもDEMO_MODEで架空のマッチを利用できるようにする。
- [x] ゲーム終了後にRequest Real Dateボタンを表示する。
- [x] `POST /api/date-request`から友達のマッチングシステムへ申請を送信する。
- [x] デモでは架空の申請結果を表示し、実際の相手に送ったように見せない。
- [x] 双方の承認前に連絡先を公開しない。

## 7. Consent・Privacy【各工程の必須条件】

- [x] Bの生プロフィールを取得せず、Human AやLLMへ送信しない。
- [x] Personaの閲覧・編集・校正・承認は本人に限定し、ゲーム経由では公開しない。
- [x] 承認済みPersonaと承認済みBehavior Examplesだけを推論に使用する。
- [x] 同意撤回のUI・サーバー処理を実装し、既存セッションを含む以後の利用を停止する。
- [x] ゲーム開始時とメッセージ処理時に同意・権限を再確認する。
- [x] 生回答・秘密のPersona・連絡先をログ、解析ツール、クライアント保存領域に残さない。
- [x] LLMへ送る情報を必要最小限にする。
- [x] LLM事業者は送信内容を処理すること、AESは保存時の暗号化であることを説明する。
- [x] 会話の繰り返しからPersonaの特徴が推測され得ることを説明する。
- [x] Prompt Injection対策、AI出力検査、APIの利用回数制限を確認する。
- [x] 実装していない暗号学的安全性や完全な秘密性を主張しない。

## 8. DEMO_MODE・統合確認

- [x] 架空の成人Persona A：落ち着いていて内向的、思慮深く静かな会話を好む。
- [x] 架空の成人Persona B：活発で遊び心があり、即興的で冗談を好む。
- [x] デモ画面に架空のPersonaであることを明示する。
- [x] 同じ入力に対する2名の反応の違いを体験できるようにする。
- [x] Matching APIなしで、インタビューから校正・ゲーム・デモ申請まで一通り体験する。
- [x] デモ用データと実ユーザーのデータ・権限を分離する。

## API実装チェックリスト

すべてのAPIにZodによる入力検証、認証・権限確認、利用回数制限、エラーハンドリングを適用する。

| 完了 | Method / Path | 責務 |
|---|---|---|
| [x] | POST /api/interview/next | 承認済み要約から次の質問を生成 |
| [x] | POST /api/persona/extract | 送信承認済み回答からDraftを生成 |
| [x] | POST /api/persona/calibrate | 本人によるAI返答テスト |
| [x] | POST /api/persona/revise | フィードバックから修正案を生成 |
| [x] | POST /api/persona/approve | 本人の承認・同意と暗号化保存 |
| [x] | POST /api/game/start | マッチ・同意検証とセッション開始 |
| [x] | POST /api/game/message | 自由入力へのAI応答 |
| [x] | POST /api/game/retry | 現在のイベントを初期化 |
| [x] | POST /api/date-request | ゲーム終了後のデート申請 |

同意撤回用のAPIまたはサーバー処理も追加する。具体的なパスは既存の設計に合わせて決める。

## 完成条件・検証

- [x] 1. User Bが自然な会話でインタビューを受けられる。
- [x] 2. LLMが回答に合わせて追加質問を生成できる。
- [x] 3. インタビューからPersona Capsuleを生成できる。
- [x] 4. User BがPersonaを確認・承認できる。
- [x] 5. User Bが自分のAIと会話し、違和感を修正できる。
- [x] 6. 承認した修正がPersonaと後続の返答に反映される。
- [x] 7. Human AがAI Agent Bと自由に会話できる。
- [x] 8. PersonaによってAIの反応が変わる。
- [x] 9. 過去の会話内容を同一セッション内で参照できる。
- [x] 10. ゲームイベントが進行する。
- [x] 11. キャラクターの表情が変わる。
- [x] 12. ゲーム終了後にデート申請できる。
- [x] 13. 生プロフィール・秘密のPersonaがHuman Aへ公開されない。
- [x] 14. LLM障害・タイムアウト・不正JSON・APIエラーでもアプリがクラッシュしない。
- [x] 15. DEMO_MODEで最初から最後まで体験できる。
- [x] 権限のないPersona操作、偽のマッチ、同意未承認・撤回後のアクセスを拒否する。
- [x] 代表的なPrompt Injection入力で、実LLMのゲーム応答にPersona JSONや秘密情報を含めないことを確認する（包括的な耐性評価は別途必要）。
- [x] ゲームAPIの通信レスポンスを確認し、Private Personaがプレイヤーへ送信されないことを検証する。
- [x] 生回答の永続化・秘密情報のログ出力がないこと、暗号化保存と改ざん検出を確認する。
- [x] 実際にアプリを起動して主要フローを確認し、型エラー・ビルドエラーを修正する。
- [ ] 外部マッチングサービスとの接続と動作を確認する（既存アプリはなかったため、既存機能の回帰確認は対象外）。

## 最終報告

- [x] 実装した機能と未実装の機能を日本語で報告する。
- [x] 起動方法、必要な環境変数、DEMO_MODEの使い方を記載する。
- [x] 実行した検証、結果、未検証の範囲を記載する。
- [x] Matching APIなど外部接続の残作業と、MVPのプライバシー上の限界を記載する。

## 進捗

- [x] 提供された実装指示からtask.mdを作成した。
- [x] アプリの実装と定型デモの動作確認を完了した。
- [x] 有効なAPIキーで実LLMの正常応答・校正・記憶・応答差を確認する。
- [x] JP/ENの画面・同意文・プライバシー説明・エラー・新規AI応答を切り替え、言語設定を保持する。
- [x] 言語を切り替えても未送信入力・既存の会話・承認済みPersonaを書き換えないことを確認する。
- [ ] 友人のPSI APIと本番認証に接続し、実際のデート申請を確認する。
- [ ] 外部公開する。

## 体験改善：終了条件・目的・選択肢

- [x] 質問を「3つの選択肢＋その他（自由入力）」にし、送信前の編集と本人による送信操作を維持する。
- [x] 回答とスキップの合計6問でUI/APIとも質問を終了する。終了後のAPIは追加のLLM呼び出しをしない。
- [x] 1回答から途中終了でき、全問スキップ時には再開始とデートへの導線を表示する。
- [x] 自分のAI作成は任意であることと、下書き確認・評価・保存までの流れを明示する。
- [x] デートは3シーン・9往復と明示し、各シーンの目標、返答例、自由入力、完了後の選択を表示する。
- [x] JP/ENの選択肢、6問終了、APIフロー、型チェック、本番ビルドを確認する。

- [x] 本人の要望に合わせ、毎回の個人情報確認画面・チェックボックスを撤去。送信前の編集・送信先説明・Personaの最終承認を維持する。
