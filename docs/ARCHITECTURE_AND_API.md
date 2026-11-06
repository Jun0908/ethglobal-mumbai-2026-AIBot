# Architecture and API contract (draft; to confirm with matching teammate)

## Trust boundaries
```
Person B browser
  | interview responses (visible + editable before sending to LLM)
  v
Adaptive interview/extraction (LLM service receives consented data only)
  | sanitized persona draft
  v
B review -> calibration -> explicit approval
  | encrypted server-side persona store (NOT given to Person A)
  v
Matching Adapter [the teammate owns PSI] ----> signed/authenticated match authorization
  | matchId, personaRef, consent reference
  v
Game backend (checks A's session, match, B consent on EVERY start/turn)
  | approved persona + current scene + limited session context
  v
LLM structured response (dialogue, emotion, event suggestion)
  | sanitized display-only output (never raw persona)
  v
A browser: Indian visual novel cafe, free-text chat, retry, request
  | date request after explicit A action
  v
Matching teammate's date-request service -> B accepts/rejects
```

## Persona schema draft
```json
{
  "personaId": "opaque-id",
  "version": 1,
  "communication": {"tone": "warm and reserved", "humor": "dry", "questionStyle": "curious"},
  "values": ["honesty", "mutual respect"],
  "behaviorExamples": [
    {"scenario": "Partner proposes a loud party", "sampleResponse": "Maybe a quieter cafe?", "tendency": "prefers calm setting"}
  ],
  "boundaries": {"allowedTopics": ["general conversation"], "privateTopics": ["identifiers", "contact", "exact locations"]},
  "approved": true
}
```
This is a human-reviewed **simulation specification**, not a validated psychological diagnosis.

## Internal game endpoints (draft)
- `POST /api/interview/next`: consented redacted summary -> adaptive follow-up (limit question count).
- `POST /api/persona/extract`: consented interview answers -> persona draft (Zod validation).
- `POST /api/persona/approve`: B authenticated, review, encrypt + store, consent record.
- `POST /api/persona/calibrate`: B tests a response (only B).
- `POST /api/persona/revise`: B feedback -> proposed edits -> B approval.
- `POST /api/game/start`: authenticated A + authorized matchId -> server session (NO persona returned).
- `POST /api/game/message`: sessionId + free-text message -> dialogue/emotion/event/state.
- `POST /api/game/retry`: reset selected event/session branch.
- `POST /api/date-request`: A authorizes request; B must accept before any off-platform info exchange.

## Cross-team matching adapter to agree
```typescript
type AuthorizedMatch = {
  matchId: string;
  viewerId: string;               // authenticated player A
  personaRef: string;              // opaque reference, not persona content
  simulationConsent: boolean;      // verified server-side, never trusted from client
  expiresAt?: string;
};
interface MatchingAdapter {
  getAuthorizedMatch(viewerId: string, matchId: string): Promise<AuthorizedMatch | null>;
  createDateRequest(viewerId: string, matchId: string): Promise<{ requestId: string; status: "pending" }>;
}
```
**No API contract is final until matching teammate approves it.** Mock adapter must be clearly labeled in demo.

## LLM response contract
```json
{"dialogue":"That sounds interesting—what drew you to it?","emotion":"shy","eventSuggestion":"continue","sceneHint":"cafe"}
```
Server determines scene transitions; never allow model output to override auth/consent or disclose persona.

## Security and failure handling
Authenticate B at approval/revision, A on game turns; avoid trusting client-sent personaRef; enforce authorization and consent revocation; keep keys in env/secrets manager, not repo; logs redacted; test prompt-injection attempts and personal-data extraction; limit turns and input size; show graceful errors; treat encrypted at rest as distinct from LLM privacy.
