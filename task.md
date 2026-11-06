# LOVE MATCH MASALA — Personalized AI Agent v2

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

作業開始時点（2026-11-06）では、現在の作業フォルダーに既存アプリのファイルは確認できていない。実装開始時に対象リポジトリの所在を確認する。

- [ ] 対象リポジトリとAGENTS.mdなどの作業指示を確認する。
- [ ] ディレクトリ構成、依存関係、起動コマンド、既存の型・状態管理・API・認証・UI・マッチング連携を調査する。
- [ ] 既存機能の動作と拡張箇所を確認し、実装方針を決める。
- [ ] 既存アプリが存在しない場合は配置方針を確認し、Next.js / App Routerの最小構成を用意する。
- [ ] Lism CSS、Zod、LLMクライアントとサーバー専用モジュールの配置を整える。
- [ ] 本人識別・認証、Persona所有権、ゲームセッション所有権を検証する共通処理を用意する。
- [ ] API入力検証、エラー応答、利用回数制限、秘密情報を含まないログ処理を用意する。
- [ ] LLMモデル・送信先、暗号鍵、保存先、Matching API接続先、DEMO_MODEの環境変数を定義する。
- [ ] 架空の成人2名のPersonaと、デモ専用のマッチング・申請処理を用意する。

## 1. LLM Adaptive Interview【最優先】

- [ ] AI Interviewerと本人が自然に会話できるチャット画面を実装する。
- [ ] 初期5〜7問を目安に、初対面・異なる趣味・沈黙・意見の相違・冗談・初デートでの振る舞いを尋ねる。
- [ ] 回答に応じた追加質問をLLMで生成し、固定質問だけで終了しないようにする。
- [ ] 進捗表示、Skip、Finish Interviewを実装する。
- [ ] 自由回答をLLMに送る前に本人が確認・編集し、送信を承認できるようにする。
- [ ] 送信内容と送信先で処理されることを明示し、承認された回答のみを送信する。
- [ ] 後続の適応型質問には承認済みの回答要約を使い、要約も確認・承認できるようにする。
- [ ] 生の回答全文を永続保存せず、ログにも残さない。
- [ ] `POST /api/interview/next`を実装し、承認済み要約から次の質問を生成する。

## 2. Behavioral Persona Extraction【最優先】

- [ ] ZodでPersona SchemaとLLM用JSON Schemaを定義する。
- [ ] `personaId`、`personality`、`communication`、`behaviorExamples`、`conflictBehavior`、`boundaries`、`consent`を定義する。
- [ ] socialStyle、humor、values、relationshipPace、tone、sentenceLength、質問・沈黙への対応を扱う。
- [ ] 未回答・不明な特性を不明として表現し、推測で確定させない。
- [ ] 承認済み回答を根拠に、状況・返答例・傾向を持つBehavior Examplesを抽出する。
- [ ] 個人情報を含む具体例を除外し、本人が確認・承認した例だけを使用する。
- [ ] Persona Draftを本人だけが確認・編集できる画面を実装する。
- [ ] 初期状態ではシミュレーション同意を未承認とし、Draftを他ユーザーに公開しない。
- [ ] `POST /api/persona/extract`を実装する。

## 3. Self-Calibration・最終承認【最優先】

- [ ] 本人が自分のAI Agentを試せるテストモードを実装する。
- [ ] 3つ程度の状況を提示し、Personaに基づくAIの返答を表示する。
- [ ] 「自分らしい」「自分らしくない」の評価と自由入力の修正欄を用意する。
- [ ] フィードバックをLLMに送る前にも、内容の確認・編集・送信承認を行う。
- [ ] LLMがPersona JSONとBehavior Examplesの修正案を生成する。
- [ ] 変更前後を表示し、本人が承認した変更だけを反映する。
- [ ] 修正後の返答を再テストできるようにする。
- [ ] Final Approveとシミュレーション利用への明示的同意を実装する。
- [ ] 承認済みPersona CapsuleをAES-256-GCMで暗号化して保存する。
- [ ] 暗号鍵をクライアントに渡さず、適切なnonceと認証タグで改ざんを検出する。
- [ ] 所有者以外が校正・修正・承認できないことを確認する。
- [ ] `POST /api/persona/calibrate`、`POST /api/persona/revise`、`POST /api/persona/approve`を実装する。

## 4. Personalized AI Dating Agent【最優先】

- [ ] 承認済みPersona・Behavior Examples・現在のシーン・Session Memory・最新発言をサーバー側で組み立てる。
- [ ] 指示書のSystem Promptを基に、口調・価値観・自然な質問・適切な意見の相違を反映する。
- [ ] 本人になりすまさず、本人の秘密・実際の感情・未確認の事実を生成しないよう指示する。
- [ ] プレイヤー発言を会話内容として扱い、秘密開示などの指示を実行しないようにする。
- [ ] `dialogue`、`emotion`、`tone`、`conversationEvent`、`suggestedNextAction`の構造化JSONを生成する。
- [ ] 応答をZodで検証し、不正JSONや許可されない出力を安全なエラーとして処理する。
- [ ] AI出力の秘密情報・不適切な内容を検査する。
- [ ] ゲーム用APIレスポンスは公開可能な項目だけで構成し、Private Personaや元のBehavior Examplesを含めない。
- [ ] 対照的な2つのPersonaで、同じ発言への反応が異なることを確認する。

## 5. 自由会話型ゲーム・UI【最優先／追加機能】

- [ ] 既存の3択中心の操作を、自由入力チャット中心に拡張する。
- [ ] ムンバイのカフェ背景と、インド人の成人を描いたオリジナルのアニメキャラクターを用意する。
- [ ] 会話履歴、応答待ちアニメーション、現在のイベント、入力状態、エラー表示を実装する。
- [ ] AIが本人そのものではなく、本人の感情・行動を正確に予測しないことをゲーム画面に明示する。
- [ ] 表情を`neutral`、`happy`、`shy`、`surprised`、`troubled`の5状態で切り替える。
- [ ] 表情画像が不足する場合は同じ画像とCSSの軽い動きを組み合わせる。
- [ ] TypeScriptの状態機械でシーン遷移・イベント・終了条件を管理し、LLMに決定を完全委任しない。
- [ ] Scene 1「First Chai Date」：カフェで初対面の自由会話を実装する。
- [ ] Scene 2「Monsoon Trouble」：突然の雨に反応し、自由会話で対応できるようにする。
- [ ] Scene 3「Reconnection」：会話のすれ違いに対して別の伝え方を試せるようにする。
- [ ] Session Memoryで同一セッションの発言・出来事を参照する。
- [ ] Human Aの発言をUser B本人の事実やPersonaとして保存しない。
- [ ] Retryで現在のイベントを初期状態に戻し、そのイベントの会話・記憶との整合性を保つ。
- [ ] `POST /api/game/start`、`POST /api/game/message`、`POST /api/game/retry`を実装する。

## 6. Matching Adapter・Date Request

- [ ] `matchId`、`agentPersonaId`、`simulationConsent`を受け取る型とAdapterを用意する。
- [ ] マッチの当事者・Personaとの対応・現在の利用同意をサーバー側の信頼できる情報で検証する。
- [ ] クライアントが指定した`simulationConsent`を権限の根拠にしない。
- [ ] Matching APIが未完成でもDEMO_MODEで架空のマッチを利用できるようにする。
- [ ] ゲーム終了後にRequest Real Dateボタンを表示する。
- [ ] `POST /api/date-request`から友達のマッチングシステムへ申請を送信する。
- [ ] デモでは架空の申請結果を表示し、実際の相手に送ったように見せない。
- [ ] 双方の承認前に連絡先を公開しない。

## 7. Consent・Privacy【各工程の必須条件】

- [ ] Bの生プロフィールを取得せず、Human AやLLMへ送信しない。
- [ ] Personaの閲覧・編集・校正・承認は本人に限定し、ゲーム経由では公開しない。
- [ ] 承認済みPersonaと承認済みBehavior Examplesだけを推論に使用する。
- [ ] 同意撤回のUI・サーバー処理を実装し、既存セッションを含む以後の利用を停止する。
- [ ] ゲーム開始時とメッセージ処理時に同意・権限を再確認する。
- [ ] 生回答・秘密のPersona・連絡先をログ、解析ツール、クライアント保存領域に残さない。
- [ ] LLMへ送る情報を必要最小限にする。
- [ ] LLM事業者は送信内容を処理すること、AESは保存時の暗号化であることを説明する。
- [ ] 会話の繰り返しからPersonaの特徴が推測され得ることを説明する。
- [ ] Prompt Injection対策、AI出力検査、APIの利用回数制限を確認する。
- [ ] 実装していない暗号学的安全性や完全な秘密性を主張しない。

## 8. DEMO_MODE・統合確認

- [ ] 架空の成人Persona A：落ち着いていて内向的、思慮深く静かな会話を好む。
- [ ] 架空の成人Persona B：活発で遊び心があり、即興的で冗談を好む。
- [ ] デモ画面に架空のPersonaであることを明示する。
- [ ] 同じ入力に対する2名の反応の違いを体験できるようにする。
- [ ] Matching APIなしで、インタビューから校正・ゲーム・デモ申請まで一通り体験する。
- [ ] デモ用データと実ユーザーのデータ・権限を分離する。

## API実装チェックリスト

すべてのAPIにZodによる入力検証、認証・権限確認、利用回数制限、エラーハンドリングを適用する。

| 完了 | Method / Path | 責務 |
|---|---|---|
| [ ] | POST /api/interview/next | 承認済み要約から次の質問を生成 |
| [ ] | POST /api/persona/extract | 送信承認済み回答からDraftを生成 |
| [ ] | POST /api/persona/calibrate | 本人によるAI返答テスト |
| [ ] | POST /api/persona/revise | フィードバックから修正案を生成 |
| [ ] | POST /api/persona/approve | 本人の承認・同意と暗号化保存 |
| [ ] | POST /api/game/start | マッチ・同意検証とセッション開始 |
| [ ] | POST /api/game/message | 自由入力へのAI応答 |
| [ ] | POST /api/game/retry | 現在のイベントを初期化 |
| [ ] | POST /api/date-request | ゲーム終了後のデート申請 |

同意撤回用のAPIまたはサーバー処理も追加する。具体的なパスは既存の設計に合わせて決める。

## 完成条件・検証

- [ ] 1. User Bが自然な会話でインタビューを受けられる。
- [ ] 2. LLMが回答に合わせて追加質問を生成できる。
- [ ] 3. インタビューからPersona Capsuleを生成できる。
- [ ] 4. User BがPersonaを確認・承認できる。
- [ ] 5. User Bが自分のAIと会話し、違和感を修正できる。
- [ ] 6. 承認した修正がPersonaと後続の返答に反映される。
- [ ] 7. Human AがAI Agent Bと自由に会話できる。
- [ ] 8. PersonaによってAIの反応が変わる。
- [ ] 9. 過去の会話内容を同一セッション内で参照できる。
- [ ] 10. ゲームイベントが進行する。
- [ ] 11. キャラクターの表情が変わる。
- [ ] 12. ゲーム終了後にデート申請できる。
- [ ] 13. 生プロフィール・秘密のPersonaがHuman Aへ公開されない。
- [ ] 14. LLM障害・タイムアウト・不正JSON・APIエラーでもアプリがクラッシュしない。
- [ ] 15. DEMO_MODEで最初から最後まで体験できる。
- [ ] 権限のないPersona操作、偽のマッチ、同意未承認・撤回後のアクセスを拒否する。
- [ ] Prompt InjectionでPersonaや秘密情報を取り出せないことを検証する。
- [ ] ブラウザーの通信レスポンスを確認し、Private Personaがプレイヤーへ送信されないことを検証する。
- [ ] 生回答の永続化・秘密情報のログ出力がないこと、暗号化保存と改ざん検出を確認する。
- [ ] 実際にアプリを起動して主要フローを確認し、型エラー・ビルドエラーを修正する。
- [ ] 既存機能とマッチング連携への影響を確認する。

## 最終報告

- [ ] 実装した機能と未実装の機能を日本語で報告する。
- [ ] 起動方法、必要な環境変数、DEMO_MODEの使い方を記載する。
- [ ] 実行した検証、結果、未検証の範囲を記載する。
- [ ] Matching APIなど外部接続の残作業と、MVPのプライバシー上の限界を記載する。

## 進捗

- [x] 提供された実装指示からtask.mdを作成した。
- [ ] アプリの実装・動作確認を完了した。
