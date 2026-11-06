# LOVE MATCH MASALA

Next.js / React / TypeScript / Lism CSSで実装する、Personaを本人が確認・校正できる自由会話型デートシミュレーション。

インタビューの送信前確認、Personaの抽出・校正・変更承認・暗号化保存、自由会話、3つのシーン、表情のCSS演出、Retry、同意撤回、架空のデート申請を実装済み。デモ2名には同じ成人キャラクターの共通イラストを使用する。

## ローカル起動

```powershell
npm.cmd install
# .env.exampleを.envへコピーし、OPENAI_API_KEYを設定
npm.cmd run dev
```

`http://127.0.0.1:3000`を開く。キーはクライアントへ渡さない。`LLM_MODE=auto`ではキーがあるとOpenAI、ない場合は明示した定型デモを使う。APIエラー時に定型デモへ黙って切り替えることはしない。

`DEMO_MODE=true`はマッチング・申請を架空のものにする設定。AI推論の使用有無とは別。実API検証には架空の成人の入力だけを使用する。

## 確認コマンド

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

APIフロー検証は別ターミナルで`$env:LLM_MODE='demo'; $env:PORT='3001'; npm.cmd run dev`を起動し、`npm.cmd run test:flow`を実行する。

本番ビルドでデモを起動する場合：

```powershell
npm.cmd run build
$env:LLM_MODE='demo'
npm.cmd start
```

既にこの方法で`http://127.0.0.1:3000`を起動している。OpenAI接続へ切り替える際はサーバーを停止し、`Remove-Item Env:LLM_MODE -ErrorAction SilentlyContinue`でデモ用上書きを解除して、修正済みの.envを使って起動する。

`npm.cmd run test:security`は稼働中の3000番ポートに対して、不正JSON・送信元・入力サイズ・未認証・回数制限を検証する。`TEST_BASE_URL`で接続先を変えられる。

`npm.cmd run test:live`は実際のOpenAI APIを呼ぶ検証。架空の成人の入力だけを使用し、LLM_MODE=auto/openai・DEMO_MODE=trueのサーバーで実行する。API利用料が発生する。

ビルド後、`node --env-file=.env scripts/check-artifacts.mjs`でクライアント出力へのキー混入と秘密ファイルの配布対象入りを検査できる。値は出力しない。

## 環境変数

| 変数 | 用途 |
|---|---|
| OPENAI_API_KEY | OpenAI APIキー（サーバー専用） |
| OPENAI_MODEL | 使用モデル。既定値gpt-4.1-mini |
| LLM_MODE | auto / openai / demo |
| DEMO_MODE | trueなら架空のマッチ・申請。既定true |
| PERSONA_ENCRYPTION_KEY | 実運用時必須。32バイトを64桁の16進数で設定 |
| PERSONA_DATA_DIR | 暗号化Personaの保存先。既定.data/personas |
| MATCHING_API_URL / MATCHING_API_TOKEN | PSI側のAPI接続先とサービス認証 |
| MATCHING_IDENTITY_SECRET | PSIから受け取る本人確認署名の共有鍵 |

デモでは暗号鍵を`.data/demo-encryption-key`に自動生成する。`.env`と`.data`はGit除外対象。暗号化は保存時のみであり、推論時には承認済みPersonaをOpenAIが処理する。繰り返しの会話から会話傾向が推測される可能性もある。

実マッチング接続は[Adapter仕様](docs/MATCHING_ADAPTER.md)を参照。単一Nodeプロセス・永続ディスク向けのMVPであり、外部認証や共有データストアの接続は別途必要。

## 検証結果・残作業

2026-11-06時点：

- 型チェック、本番ビルド：成功。
- 単体テスト5件：成功（暗号化・改ざん検出、状態遷移、Retry、公開DTO、出力検証）。
- 本番起動でのAPI一連フロー：成功（定型デモ）。本人の修正、2名の応答差、セッション記憶、3シーン、申請の重複防止、所有権、同意撤回を確認。
- 不正JSON、異なるOrigin、未成年設定、過大入力、未認証、利用回数制限：拒否を確認。
- ブラウザー：送信前承認から校正・承認・会話まで確認。本番ビルドで3シーン9ターンとデモ申請の完了を確認。390px幅のホームとゲームで横はみ出しなし。実API認証エラー時に入力を保持し、再試行できることを確認。
- 配布用ファイル一覧に.env/.dataなし。クライアント出力に設定されたAPIキーの値なし。
- OpenAI実接続は401 invalid_api_keyで停止。ユーザーの希望でキー修正は後日。正常応答・実LLMの会話品質・実LLMでの校正反映・Prompt Injectionへの耐性は未検証。
- 友人のPSI APIと本番認証の接続、実際の相手へのデート申請、外部公開は未実施。

出力検査と個人情報フィルターは簡易的な検出であり、全ての漏洩やPrompt Injectionを防ぐ保証はない。実ユーザーへの提供には、データ保持・削除、継続的な同意管理、本番認証とセキュリティの追加検証が必要。現在は架空の成人Personaでデモする。
