# Asha story and demo controls

Asha is a fictional adult, 27. Her independent 12-decision story is set around a small bookshop reading night:
1. An invitation between pages: meeting among shelves and deciding whether to help.
2. Finding a voice: preparing chairs and invitations, hearing about Asha's own letter.
3. The last empty seat: the reading, sharing a quiet moment, and a romantic or friendship invitation.

Both JP and EN have authored dialogue, source-backed discoveries, memories, optional free conversation, practice/restore and chapter callbacks. The same rendering and state machine support both stories, with story-specific content, artwork and preferences. Asha uses her own cookie and encrypted save; Mira's existing cookie and save are preserved. Compatibility and milestone derivation use the selected story's choices, not Mira's wording.

## Hidden demo reset
In demo mode, click/tap the footer's **LOVE MATCH MASALA** five times in succession. A pause of more than four seconds resets the tap count. The visible title does not otherwise look like a control.

The native confirmation dialog offers Asha, Mira or both. The final button removes only the selected stories' conversations, memories, practice backups and progress, then returns home. Created personas, approvals and photo selections are kept. Cancel is non-destructive. The control and reset API are unavailable outside demo mode.

Reset retains a monotonically increasing revision so in-flight or stale choices cannot replay against a fresh story. The reset itself can be retried idempotently. Resetting one story leaves the other's revision and messages untouched.

## Validation
- 33 unit tests passed; typecheck and production build passed.
- `node scripts/check-asha.mjs` exercises disposable browser cookies: distinct Asha introduction, real LLM side conversation, all three chapters, friendship ending, independent Mira state, selective reset, stale revision rejection and reset replay.
- IAB verified Asha entry, identity, chapter title, story-specific memory labels, footer five-tap activation and cancellation. Portrait and memory illustrations are stored in public assets. JP/EN and 390px mobile layout were checked; no horizontal overflow or browser console errors. Human evaluation of enjoyment is still an iteration task.
