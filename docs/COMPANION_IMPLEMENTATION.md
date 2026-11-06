# Photo twins and shared dashboard

Implemented 2026-11-07.

## Experience
- Six illustrated photo questions (24 photos), up to two preferences per question, skips and back navigation. No required prose input. Unsensitive draft selections are saved locally.
- Live twin preview; natural/gentle/playful voice selection. Changing preferences clears previous preview/approval. Publish explicitly approves the selected preferences and the displayed preview example using the existing encrypted capsule flow.
- Approved owners can reopen their photo choices, tune the voice and reapprove the same persona ID with a new version. Other owners cannot read or edit it. Revoked personas cannot be used.
- Both demo companions, own twins and verified matched capsules use Talk & play / Our dashboard. Real matches retain server-side match verification. A demo chooser now routes Asha and Mira consistently.
- Free conversation uses the approved capsule, bounded history, Japanese/English language instruction and output guard. Missing/failing model calls display a limited-generation status and do not fabricate topic evidence.
- Three-decision cooperative half-day planner: choose a meeting place, accept/change partner proposal, respond to rain. Conversation remains available during the game. Cancel returns to chat. Completed plans become illustrated memories.
- Shared dashboard: up to three discussed topics, conversation snapshots, completed plans, inspectable source messages and saveable conversation continuations. A topic starts after one supported exchange and is marked explored only after distinct user exchanges. Scripted game events do not count as lively free conversation.
- Source quotes returned by the model must exist literally in both actual messages. Explicit topic words found in both messages can also support a topic without a model-supplied quote. Topic tagging is an interpretation, not a verified measure of enjoyment or attraction.
- Deleting an exchange removes both messages, related evidence and dependent game plans. Earlier Mira story/hearts/compatibility remain available from the dashboard.

## Storage and boundaries
Companion records are encrypted using the existing AES-GCM storage key and written atomically under `.data/companions`. Demo records use an opaque HttpOnly SameSite cookie, expire after 30 days without activity, and survive server restart/session renewal. Own/real matched records remain owner-bound; the existing demo owner login is an in-memory eight-hour session, so long-lived account recovery for owned personas still needs durable authentication. Real authenticated owner continuity depends on the existing identity integration.

Photo selection is a statement of preferences, not a personality inference. Fictional demo characters are identified separately. Twin interactions and game plans are not represented as the person's lived experiences. Publishing means approval for simulation use through the existing matching authorization; no public discovery marketplace or external matching service is provisioned by this change.

## Verification
- Unit suite: 31 passed, including preferences without inferred biography, surviving evidence, dependent deletion and game/chat separation.
- Production build and TypeScript passed.
- `node scripts/check-companion.mjs`: live chat and preview, planner, retry idempotency, stale revisions, browser isolation, dashboard save, deletion, photo creation, owner authorization, restored edit choices, same-ID reapproval, revocation.
- `node scripts/check-companion.mjs --resume`: physical production server restart and renewed identity restore the same demo record revision.
- IAB: photo selection/back/preview, voice tuning, live Japanese conversation, planner and dashboard; desktop and mobile captures in `.data/visual-design`. English labels and mobile overflow checked separately.
- External real matching service is not exercised with a real person's capsule in this run. Human evaluation of conversation quality and game enjoyment remains necessary.

## Follow-up: keep the preferred date experience
The Date experience entry now opens the earlier companion selector, Asha conversation and Mira three-chapter story with hearts and compatibility. Own approved twin previews retain the newer conversation/dashboard screen. Photo creation expands from three to six themes: day off, food, shared activities, travel, unwinding and evenings. Old three-theme local drafts and approved capsules normalize to six rows without losing existing selections. From the third theme onward, users may try the twin early. All twelve selected preferences (two per theme) fit the capsule schema.

Verified in IAB: old selector and saved Mira story restored, six-theme progress, additional photo sets, early preview and retained choices. Build and 31 unit tests pass.
