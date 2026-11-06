# AI Assistance Disclosure

## Current status

This repository uses OpenAI Codex as an AI coding assistant.

Implementation is in progress. Completed checks are recorded in the commits and project README.

## Human direction actually provided

- The user supplied the LOVE MATCH MASALA product requirements, privacy requirements, implementation order, and acceptance criteria.
- The user selected this GitHub repository as the push destination and requested small, incremental pushes.

## AI-assisted work completed

- `task.md`: organized the supplied requirements into an implementation and verification checklist.
- `docs/IMPLEMENTATION_BRIEF.md`: preserved the original user-supplied implementation brief without claiming it was written by Codex.
- `docs/HUMAN_PREPARATION.md`: documented API and deployment preparation.
- `AI_USAGE.md`: created this disclosure.
- `.gitignore`: added repository hygiene rules for local secrets and generated output.
- Repository inspection and documentation change preparation.
- `src/lib/`: Codex-assisted Persona schemas, structured LLM calls, scripted demo responses, server-side session and encryption utilities, game state machine.
- `src/app/`: Next.js shell and Lism CSS setup.
- `tests/core.test.ts`: encryption integrity, scene transitions, retry memory and public response checks.
- `src/app/api/` and `src/lib/server/matching.ts`: owner-authorized APIs, consent revocation and matching integration contract.
- `scripts/check-flow.mjs`: API flow checks using fictional adult inputs; actual scripted-mode flow passed.
- `src/components/masala-app.tsx` and `src/app/globals.css`: Codex-assisted responsive interview, calibration and dating interface; browser checks used fictional adult inputs.
- `public/chai-date.png`: generated with OpenAI image generation, depicting an original fictional adult Indian character aged 27 in a Mumbai cafe. Originally shared by both demo personas; now used for Asha. No actual person is depicted.
- `scripts/check-live.mjs`, `scripts/check-security.mjs`, `scripts/check-artifacts.mjs`: live-provider, invalid-input/rate-limit and build-artifact checks.
- `src/lib/i18n.ts`, language-aware APIs and UI, `tests/i18n.test.ts`, `scripts/check-languages.mjs`: Codex-assisted JP/EN translations, saved language preference, new-response language selection and preservation checks.

- `public/mira-portrait.png`: generated with the built-in image generation tool as a distinct original fictional 27-year-old Indian woman. Asha was a style reference. Final prompt recorded in `docs/MIRA_ARTWORK.md`.

## Direction artifacts

- Original implementation brief: `docs/IMPLEMENTATION_BRIEF.md`.
- Planning artifact: `task.md`.
- Additional user direction: use `Jun0908/ethglobal-mumbai-2026-AIBot` and push incremental changes.

## Verification and future updates

Initial documentation was checked with Git diff and whitespace checks. Implementation validation is recorded as it is performed; automated checks are AI-run unless explicitly attributed to a human.

Update this file alongside implementation to identify AI-assisted modules and assets, human architecture and product decisions, reviews, integration work, and checks actually performed. Do not describe planned human reviews as completed reviews.

2026-11-06 validation: TypeScript and production build passed; nine unit tests, the scripted-demo API flow, negative API checks and secret-artifact checks passed. After the user updated the local credential, live OpenAI checks passed for Japanese and English interview/extraction/calibration/revision, session recall, three scenes, contrasting Personas and simulated requests. A representative injection probe was checked; no comprehensive safety guarantee is claimed. Browser checks covered JP/EN switching, English adaptive questions and Persona generation, preserved unsent text, persisted language preference and a 390px English layout. External PSI integration and actual date delivery have not been tested. No human code review or human UI acceptance is claimed.
