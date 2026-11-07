# Secret Tender

**会う前に、ふたりの時間を。**

[English](README.md) · [デモを体験する](https://love-match-masala.vercel.app/)

Secret Tenderは、気になる人のAIの分身との会話や小さなデートゲームから、「この人と一緒にいたら、どんな時間になるだろう？」を体験するサービスです。会話のテンポを感じ、一緒に思い出を作り、本人に会ったら聞いてみたいことを見つけます。

分身には、本人が選び、確認・承認した好みや会話の傾向を反映します。本人への関心が生まれるきっかけとして使う体験であり、実際の気持ちやデートの結果を予測するものではありません。

## できること

- **相手との時間を体験する。** 架空の成人キャラクターAshaの古書店と朗読会、Miraの写真やチャイをめぐる異なる物語を遊べます。選択によって出来事が進み、物語の後も会話を続けられます。
- **タップで自分の分身を作る。** 6テーマ24枚の写真と、性格・恋愛に関する6項目のイラストから選択します。長い自己紹介は不要で、スキップや途中プレビュー、話し方の調整ができます。写真は好みの選択であり、そこから性格を自動診断しません。
- **話して確かめてから承認する。** 下書きの分身と会話して調整し、シミュレーションへの利用を承認します。作成者は後から編集し、再承認できます。
- **友達を招待する。** 承認済みの分身に7日間有効な招待リンクを作れます。リンクは停止でき、分身を更新すると古いリンクは無効になります。訪問者ごとに記録を分離し、会話全文を作成者へ自動公開しません。
- **話す・遊ぶ・振り返る。** 分身との会話では、3回の選択で作るデートプランゲームと、思い出・話した話題・会ったら聞きたいことをまとめる一ページのダッシュボードを使えます。物語では関係の進展や相性の振り返りを図でも表示します。
- **JP/ENを切り替える。** 画面と新しいAIの返答を日本語・英語に切り替えます。過去の会話や承認済みPersonaの文章は書き換えません。

## 体験する

[公開デモ](https://love-match-masala.vercel.app/)を開き、18歳以上であることを確認して「デートを体験」または「自分の分身をつくる」を選びます。架空キャラクターの物語を遊ぶだけなら、分身の作成は不要です。

AshaとMiraは架空のデモ相手です。自分の分身は本人が承認した設定で動きます。公開デモは実マッチングサービスへ接続せず、実際のデート申請も送信しません。

## ローカルで起動する

公開環境はNode.js 24.xを使っています。依存関係をインストールし、環境変数ファイルを作成します。

```powershell
npm.cmd ci
Copy-Item .env.example .env
```

AIによる会話を使う場合は、`.env`の`OPENAI_API_KEY`を設定し、`LLM_MODE=openai`にします。その後、起動します。

```powershell
npm.cmd run dev
```

[http://127.0.0.1:3000](http://127.0.0.1:3000)を開きます。

APIキーなしで定型応答を試す場合は`LLM_MODE=demo`にします。`auto`ではキーがあればOpenAI、なければ定型デモであることを明示して動きます。OpenAIのエラー時に黙って定型応答へ切り替えることはありません。

`DEMO_MODE=true`はマッチングや申請を架空にする設定で、`LLM_MODE`とは独立しています。公開デモは架空のマッチングとOpenAIを組み合わせています。OpenAI APIの利用料は別途発生します。

## 設定と保存

秘密の値はサーバー側に置きます。[.env.example](.env.example)を参照してください。

| 変数 | 用途 |
| --- | --- |
| `OPENAI_API_KEY` | サーバー専用のOpenAI APIキー。 |
| `OPENAI_MODEL` | 使用モデル。既定値は`gpt-4.1-mini`。 |
| `LLM_MODE` | `auto` / `openai` / `demo`。 |
| `DEMO_MODE` | 既定値は`true`。`false`には外部マッチング・本人認証の接続が必要。 |
| `PERSONA_ENCRYPTION_KEY` | 32バイトを64桁の16進数で指定する固定の暗号鍵。Vercel・Redis利用時とローカルデモ以外で必須。 |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | 共有Redis接続。Vercel連携の`KV_REST_API_URL`と`KV_REST_API_TOKEN`にも対応。 |
| `PERSONA_DATA_DIR` | ローカルのPersona保存先。既定値は`.data/personas`。 |
| `MATCHING_API_URL`, `MATCHING_API_TOKEN`, `MATCHING_IDENTITY_SECRET` | 外部マッチングAPIと本人確認の設定。 |
| `MASALA_PUBLIC_ORIGIN` | リバースプロキシ経由で共有する場合の、正確なHTTPSオリジン。任意。 |

ローカルデモでは永続記録を暗号化して`.data`へ保存し、鍵が未指定ならローカル用の鍵を生成します。一部の一時状態はメモリに保持します。デモの所有者セッションは最大30日間で、サーバー再起動後も再開できます。これは同一ブラウザの継続利用であり、アカウント復旧機能ではありません。Cookieを消すと所有する記録へ戻れなくなることがあります。

Vercelでは共有状態・セッション・レート制限・ロックのためにRedisが必要です。非公開の記録はAES-256-GCMで暗号化し、ProductionとPreviewの保存領域を分けています。暗号鍵を変更すると保存済みデータを読めなくなるため、同じ鍵を維持してください。ローカルの記録を自動アップロード・移行しません。

OpenAIを使う場合、承認済みPersonaや送信した会話は同社が処理します。保存時の暗号化で推論先から入力を隠せるわけではありません。所有権・同意撤回・引用根拠の検証を実装していますが、人による会話品質の評価や本番の本人認証整備は引き続き必要です。

## 確認コマンド

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

現在の単体テストは36件です。API検証スクリプトには起動中のテストサーバーが必要です。例として、`node scripts/check-invite.mjs`は招待作成・訪問者の記録分離・招待停止・分身更新による旧リンク無効化を確認します。`TEST_BASE_URL`でテスト先を指定できます。AI機能を試すスクリプトは、接続先がOpenAIを使う場合にAPI利用料が発生します。

ビルド後、`node --env-file=.env scripts/check-artifacts.mjs`でクライアント成果物へのAPIキー混入を検査できます。キーの値は出力しません。

## 公開環境

公開サイトはVercel HobbyとUpstash RedisのFreeプランで動いています。どちらも無料枠に上限があり、OpenAIの利用料は別です。ローカルの秘密ファイルとランタイムデータは`.gitignore`と`.vercelignore`で除外しています。

[公開状況と手順](docs/VERCEL_DEPLOYMENT.md)を参照してください。現在はCLIから公開しています。GitHubの自動デプロイにはVercelアカウントのGitHub Login Connectionが必要で、現状は`main`へのPushだけではデプロイされません。

## 構成と実装資料

Next.js App Router / React / TypeScript / Lism CSS / OpenAI Responses API / Zod / Upstash Redis。

物語の分岐やゲーム状態はコードで管理し、AIはPersonaを反映した台詞を生成します。ダッシュボードの話題や振り返りは実際の発言を根拠にし、根拠不足は未判定にします。物語の関係表示はシミュレーション内の進展であり、実人物の好意を示すものではありません。

- [タスクと実装履歴](task.md)
- [Playwrightによるデモ動画の録画と編集](docs/DEMO_VIDEO.md)
- [イラストで選ぶ性格・恋愛の項目](docs/ILLUSTRATED_PERSONALITY.md)
- [招待された分身の体験](docs/INVITED_TWIN_FLOW.md)
- [友達への試遊案内](docs/FRIEND_PLAYTEST.md)
- [外部マッチングAdapter仕様](docs/MATCHING_ADAPTER.md)
- [AIの利用](AI_USAGE.md)

実装資料の一部は当時の状態を記録した履歴です。リポジトリ・パッケージ名・内部APIの識別子は、互換性を保つため元のLOVE MATCH MASALAの名称を維持しています。
