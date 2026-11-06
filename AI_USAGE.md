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

## Direction artifacts

- Original implementation brief: `docs/IMPLEMENTATION_BRIEF.md`.
- Planning artifact: `task.md`.
- Additional user direction: use `Jun0908/ethglobal-mumbai-2026-AIBot` and push incremental changes.

## Verification and future updates

Initial documentation was checked with Git diff and whitespace checks. Implementation validation is recorded as it is performed; automated checks are AI-run unless explicitly attributed to a human.

Update this file alongside implementation to identify AI-assisted modules and assets, human architecture and product decisions, reviews, integration work, and checks actually performed. Do not describe planned human reviews as completed reviews.
