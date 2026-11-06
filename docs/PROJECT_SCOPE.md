# LOVE MATCH MASALA — AI Dating Game Scope

**ETHGlobal Mumbai 2026 | Planning only | 2026-11-06**

## One-line product
After a privacy-preserving PSI match, a human plays a Japanese visual-novel-inspired, Indian-setting first-date game with an **AI simulation based on the real match's approved communication traits**. A real-date request is optional and requires the real person's consent.

## Ownership boundary
- **Teammate / Matching:** PSI protocol, matching decision, wallet/identity, optional ENS/Arkiv. These are **not** implemented in this repository's AI game scope.
- **This repository / AI Game:** adaptive interview, private persona extraction, owner review and self-calibration, consent, server-side persona store, personalized LLM dialogue, game state, first-date flow, request handoff.
- **Cross-team contract:** verified match identifier, authorized persona reference, current simulation consent; return date request with no contact details.

## MVP happy path (demo target: 2–3 minutes)
1. User B answers 5–7 **free-text** interview questions. The adaptive interviewer asks contextual follow-ups.
2. B checks sanitized traits/examples, talks to an AI preview, edits one incorrect behavior, and explicitly approves.
3. A enters the demo via verified match or clearly labeled mock match.
4. A freely chats with Agent B in a Mumbai cafe; scene responds to dialogue; monsoon misunderstanding and retry/reconnection are optional event beats.
5. A may tap **Request a Real Date**, which goes to B for consent. No direct contact disclosure.

## MVP technical choices
Next.js / TypeScript / React / **Lism CSS (not Tailwind)** / Zod / LLM Structured Outputs / server-side session state / AES-256-GCM encrypted persona at rest where persistent / adapter for teammate PSI matching.

## Persona truth and privacy claims
- Agent B is **not** B. It is a simulation based on B's reviewed, consented abstractions.
- A never receives the persona document, raw survey answers, real identity, or contact information.
- Model inference sees **approved abstract features**; no claim of confidential inference or absolute privacy.
- Raw interview text is not retained server-side after extraction/approval; do not send unsanitized raw answers without explicit review/consent.
- Guard against indirect disclosure via repeated conversation; rate limiting, refusal/deflection, output review, revocation.
- Avoid storing real participant data in public GitHub, on-chain systems, screenshots or demo recordings.

## Not in one-day MVP
Fine-tuning, vector database, real-time 3D/world-model simulation, perfect person imitation, actual romantic outcome prediction, building PSI, advanced cryptographic proof of agent inference.

## Definition of done
Working interview → persona approval/calibration → game with free chat → optional date request, using a mock matching adapter until integration is ready; honest limitations and provenance documented.
