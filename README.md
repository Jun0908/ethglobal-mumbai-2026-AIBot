# Secret Tender

**A little time together, before you meet.**

[日本語](README.ja.md) · [Try the demo](https://love-match-masala.vercel.app/)

Secret Tender lets you explore what spending time with someone might feel like through conversations and small date games with their AI twin. Discover a conversational rhythm, make a shared memory, and find something you would love to ask when you meet the person.

The twin reflects preferences and communication tendencies its owner chooses and approves. The experience is a starting point for curiosity about the person; it does not predict their feelings or a real date’s outcome.

## What you can do

- **Meet a companion.** Try distinct fictional adult characters: Asha’s bookshop and reading-night story, or Mira’s photography and chai-date story. Choices shape events, and conversation continues beyond the story.
- **Create your AI twin with taps.** Choose from six photo themes with 24 images, then six illustrated personality and relationship topics. Skip questions, try a preview early, and adjust the voice without writing a long biography. Photo choices express preferences; they do not automatically diagnose personality.
- **Try it before approving.** Talk with your draft twin, adjust it, and approve its simulation use. Owners can edit and reapprove their twins later.
- **Invite a friend.** Share a seven-day link to an approved twin. Stop the link at any time; updating the twin invalidates older links. Visitors have separate records, and their full conversations are not automatically shown to the owner.
- **Talk, play, and look back.** The twin conversation flow includes a three-choice date-planning game and a one-page dashboard with memories, discussed topics, and things to ask when you meet. Story experiences also show relationship progress and a visual compatibility reflection.
- **Switch between Japanese and English.** JP/EN controls the interface and newly generated AI replies. Existing conversations and approved persona text keep their original language.

## Try the experience

Open [the live demo](https://love-match-masala.vercel.app/), confirm that you are 18 or older, and choose **Try a date** or **Create your AI twin**. Creating a twin is optional for the fictional character stories.

Asha and Mira are fictional demo companions. Custom twins use owner-approved settings. The demo does not connect users to a real matching service or send real date requests.

## Run locally

The deployed project uses Node.js 24.x. Install dependencies and create a local environment file:

```powershell
npm.cmd ci
Copy-Item .env.example .env
```

For generated dialogue, set `OPENAI_API_KEY` in `.env` and choose `LLM_MODE=openai`. Then run:

```powershell
npm.cmd run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

For a scripted experience without an API key, set `LLM_MODE=demo`. In `auto` mode, the app uses OpenAI when a key is present and otherwise uses the labelled scripted demo. OpenAI failures are displayed; they do not silently switch to scripted responses.

`DEMO_MODE=true` selects fictional matching and requests. It is independent of `LLM_MODE`: the public demo uses OpenAI with fictional matches. OpenAI API usage is billed separately.

## Configuration and storage

All secrets stay on the server. See [.env.example](.env.example).

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Server-side OpenAI API key. |
| `OPENAI_MODEL` | Model; defaults to `gpt-4.1-mini`. |
| `LLM_MODE` | `auto`, `openai`, or `demo`. |
| `DEMO_MODE` | Defaults to `true`; `false` requires the external matching and identity integration. |
| `PERSONA_ENCRYPTION_KEY` | Stable 32-byte key encoded as 64 hex characters. Required on Vercel, with Redis, and outside local demo mode. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Shared Redis storage. Vercel’s `KV_REST_API_URL` and `KV_REST_API_TOKEN` names are also supported. |
| `PERSONA_DATA_DIR` | Local persona directory; defaults to `.data/personas`. |
| `MATCHING_API_URL`, `MATCHING_API_TOKEN`, `MATCHING_IDENTITY_SECRET` | External matching adapter and identity verification configuration. |
| `PARENT_METADATA_TOKEN` | Server-only bearer token of at least 32 characters for parent-service persona metadata requests. |
| `MATCHING_FRONTEND_ORIGIN` | Exact allowed parent frontend origin for verified identity handoff; defaults to the Secret Tinder production origin. |
| `MASALA_PUBLIC_ORIGIN` | Optional exact HTTPS origin for reverse-proxy sharing. |

Local demo mode stores encrypted persistent records under `.data` and generates a local encryption key when none is supplied. Some local transient state remains in memory. Demo owner sessions last up to 30 days and can survive server restarts; this is browser-session continuity, not a recoverable user account. Clearing cookies can remove access to owned records.

On Vercel, Redis is required for shared state, sessions, rate limits, and locks. Private records are encrypted with AES-256-GCM; Production and Preview use separate namespaces. Keep the encryption key stable: replacing it makes existing encrypted data unreadable. Local records are not automatically uploaded or migrated.

Approved persona content and submitted conversation are processed by OpenAI when enabled. Encryption at rest does not hide inference inputs from the provider. The app includes ownership checks, revocation, and evidence validation; human evaluation of conversation quality and further production authentication work remain necessary.

## Checks

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

The current unit suite has 36 tests. Integration scripts require a running test server. For example, `node scripts/check-invite.mjs` checks invitation creation, separate visitor records, revocation, and invalidation after a twin update. Use `TEST_BASE_URL` to select the test server. Scripts that exercise AI features can call OpenAI and incur charges when the server uses it.

After a build, `node --env-file=.env scripts/check-artifacts.mjs` checks client artifacts for the configured API key without printing its value.

## Deployment

The live app runs on Vercel Hobby with an Upstash Redis Free database. Both have free-tier limits; OpenAI usage is separate. Local secrets and runtime data are excluded by `.gitignore` and `.vercelignore`.

See [deployment status and instructions](docs/VERCEL_DEPLOYMENT.md). The site has been deployed through the CLI. GitHub automatic deployment still needs the Vercel account’s GitHub Login Connection; pushing to `main` alone is not currently a deployment.

## Architecture and implementation notes

Next.js App Router · React · TypeScript · Lism CSS · OpenAI Responses API · Zod · Upstash Redis.

Story branches and game state are controlled by code; the model generates persona-aware dialogue. Dashboard topics and reflections reference actual messages, and insufficient evidence stays unknown. A story’s relationship display describes the simulation, not a real person’s attraction.

- [Task list and implementation history](task.md)
- [Playwright demo video recording and editing](docs/DEMO_VIDEO.md)
- [Illustrated personality choices](docs/ILLUSTRATED_PERSONALITY.md)
- [Invited twin flow](docs/INVITED_TWIN_FLOW.md)
- [Friend playtest guide](docs/FRIEND_PLAYTEST.md)
- [External matching adapter](docs/MATCHING_ADAPTER.md)
- [AI usage](AI_USAGE.md)

Some implementation notes are historical snapshots. The repository, package name, and internal API identifiers retain the original LOVE MATCH MASALA naming for compatibility.
