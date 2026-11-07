# Vercel 公開の状態（2026-11-07）

`jun0908s-projects/love-match-masala` はVercel Hobbyで作成済み。[Production](https://love-match-masala.vercel.app) をCLIで公開した。GitHub `Jun0908/ethglobal-mumbai-2026-AIBot` の `main` から検証済みのコードを送っているが、GitHubとVercelの自動連携はまだない。Next.jsプリセットとNode.js 24.xを設定済み。Production/Previewには `DEMO_MODE=true`、`LLM_MODE=openai`、`OPENAI_MODEL`、`OPENAI_API_KEY`、`PERSONA_ENCRYPTION_KEY` を設定済み。秘密の値はGitに含めない。

アプリはVercel上で `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`、またはVercel連携が設定する `KV_REST_API_URL` / `KV_REST_API_TOKEN` がないと保存処理を拒否する。Upstash for Redisの**free**プランを選び、自動アップグレードと有料Prod Packを無効にしてVercelプロジェクトへ接続する。Vercel CLIはUpstashの規約に本人が同意するまで `integration_terms_acceptance_required` で停止した。CLIが案内したWeb上の規約同意URLは404になることがある。その場合は本人がこのリポジトリでPowerShellを開き、以下を実行して表示される規約を確認・同意する（AIエージェントからの実行はCLIが拒否する）。

```powershell
npx --yes vercel integration accept-terms upstash --scope jun0908s-projects
```

本人の規約同意後、以下のコマンドで無料DBを作成・接続済み。Production/Preview/Developmentに `KV_REST_API_URL` と `KV_REST_API_TOKEN` が自動設定された。

```powershell
npx --yes vercel integration add upstash/upstash-kv --billing-plan free --meta primaryRegion=hnd1 --meta autoUpgrade=false --meta prodPack=false --name love-match-masala-redis --no-env-pull --json --scope jun0908s-projects --non-interactive
```

GitHubの自動デプロイには、Vercelアカウント設定の「Authentication」でGitHubのLogin Connectionを本人が追加する必要がある。現在の `vercel git connect` は `You need to add a Login Connection to your GitHub account first` で停止する。接続後、`npx --yes vercel git connect https://github.com/Jun0908/ethglobal-mumbai-2026-AIBot.git --project love-match-masala --yes --scope jun0908s-projects` を再実行する。それまではPushだけでは公開先に反映されず、検証後に `npx --yes vercel deploy --prod --yes --scope jun0908s-projects` が必要。

Vercel用のRedisは新規データベースとして開始する。ローカル `.data` の個人データ・会話・セッションを自動移行しないので、公開先では分身を改めて作成する。会話・分身・招待・セッションはアプリ側でAES-256-GCM暗号化して保存し、暗号鍵を変更すると既存データは読めなくなる。Redisのfreeプランは容量・コマンド数に上限がある。OpenAI APIは別途従量課金。

ローカル検証：36件のテスト、TypeScript、Next.js本番ビルド。Productionの認証不要HTTPS URLで画面・Asha/Miraの画像・設定API・セッション作成と再開・OpenAIの質問生成を確認した。実際のRedisを使って招待作成→別セッションでデート→招待停止→分身更新による旧招待無効化まで公開APIで確認済み。Productionへの再デプロイ後も既存セッションを再開できた。Previewは作成済みだがVercel Authenticationで保護されており、招待フローの通し検証はProductionで実施した。GitHub自動連携と公開後の人による試遊は残る。
