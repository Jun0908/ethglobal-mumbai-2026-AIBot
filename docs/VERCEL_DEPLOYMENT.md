# Vercel 公開の状態（2026-11-07）

`jun0908s-projects/love-match-masala` はVercel Hobbyで作成済み。GitHub `Jun0908/ethglobal-mumbai-2026-AIBot` の `main` を公開対象にする。Next.jsプリセットとNode.js 24.xを設定済み。Production/Previewには `DEMO_MODE=true`、`LLM_MODE=openai`、`OPENAI_MODEL`、`OPENAI_API_KEY`、`PERSONA_ENCRYPTION_KEY` を設定済み。秘密の値はGitに含めない。

アプリはVercel上で `UPSTASH_REDIS_REST_URL` と `UPSTASH_REDIS_REST_TOKEN` が両方ないと保存処理を拒否する。Upstash for Redisの**free**プランを選び、自動アップグレードと有料Prod Packを無効にしてVercelプロジェクトへ接続する。Vercel CLIはUpstashの規約に本人が同意するまで `integration_terms_acceptance_required` で停止した。規約同意後に以下の既確認コマンドを実行する。

```powershell
npx --yes vercel integration add upstash/upstash-kv --billing-plan free --meta primaryRegion=hnd1 --meta autoUpgrade=false --meta prodPack=false --name love-match-masala-redis --no-env-pull --json --scope jun0908s-projects --non-interactive
```

接続後、Vercelの環境変数名（値は表示しない）を確認し、`vercel git connect https://github.com/Jun0908/ethglobal-mumbai-2026-AIBot.git --project love-match-masala --yes --scope jun0908s-projects` でリポジトリを接続する。Previewで招待フロー・再開・削除・JP/ENを検証してからProductionを確認する。現在は**未公開**。

Vercel用のRedisは新規データベースとして開始する。ローカル `.data` の個人データ・会話・セッションを自動移行しないので、公開先では分身を改めて作成する。会話・分身・招待・セッションはアプリ側でAES-256-GCM暗号化して保存し、暗号鍵を変更すると既存データは読めなくなる。Redisのfreeプランは容量・コマンド数に上限がある。OpenAI APIは別途従量課金。

ローカル検証：36件のテスト、TypeScript、Next.js本番ビルド、所有者セッションの再起動復元、招待作成→別ブラウザでデート→招待停止→分身更新による旧招待無効化を確認。実際のRedis接続とVercel上での一周は、無料DB接続後に確認する。
