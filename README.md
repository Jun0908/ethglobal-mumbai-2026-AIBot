# LOVE MATCH MASALA

Next.js / React / TypeScript / Lism CSSで実装する、Personaを本人が確認・校正できる自由会話型デートシミュレーション。

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
