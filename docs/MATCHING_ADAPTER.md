# Matching Adapter contract

`DEMO_MODE=true` uses fictional matches and simulated date requests. Set `DEMO_MODE=false` only after implementing the following contract in the PSI service.

## Identity handoff

The trusted PSI server signs a short-lived assertion as `base64url(JSON).base64url(HMAC_SHA256(payload, MATCHING_IDENTITY_SECRET))`. Claims: `{ sub: string, aud: "love-match-masala", exp: unixSeconds }`. Expiry must be in the next 15 minutes. Use a random shared secret of at least 32 characters; never expose it to the browser.

After obtaining the assertion through the team's authenticated integration, the browser posts `{ adultConfirmed: true, assertion }` to `/api/session`. The app creates an HttpOnly, SameSite=Strict cookie and binds all operations to the verified subject. The local demo instead uses a browser-session capability; it is not identity verification for real users.

## Match verification

`GET {MATCHING_API_URL}/matches/{matchId}`

Headers: `Authorization: Bearer {MATCHING_API_TOKEN}`, `X-Player-Subject: {verifiedSubject}`.

Response: `{ matchId, agentPersonaId, playerSubject, simulationConsent: true, expiresAt: unixSeconds }`.

The service must check participation and current consent server-side. The game validates the subject, exact Persona/match IDs and expiry at start, every message, retry and date request. The client-supplied `simulationConsent` is never authoritative.

## Persona metadata for the matching service

`GET /api/personas/{personaId}/metadata` requires `Authorization: Bearer {PARENT_METADATA_TOKEN}`. Configure a distinct random token of at least 32 characters on the AIBot and matching servers. The endpoint returns only `{ personaId, ownerSubject, status: "approved" | "revoked", version }` with `Cache-Control: no-store`. It reads current server-held Persona state and never returns Persona content. Personas created without a verified matching identity are unavailable through this endpoint. Missing or invalid service credentials fail closed.

## Date requests

`POST {MATCHING_API_URL}/date-requests`

Same headers plus `Idempotency-Key: {gameSessionId}`. Body: `{ matchId, gameSessionId }`. Response: `{ requestId, status: "pending" | "accepted" }`.

The matching service must persist the idempotency key, verify both participants' decisions and handle contact release separately. This app does not request or expose contact information.

## Local MVP limitations

Encrypted capsules are files on the Node server. Sessions, drafts, rate limits and game state are process-local and expire (identity: 8 hours, draft: 1 hour, game: 2 hours). Deploy as a single process on persistent storage for this MVP. Production needs durable shared sessions/rate limits, a database, robust identity integration and account deletion/retention policy. Raw interview answers are not persisted; the drafts contain only approved extracted examples. Provider processing is disclosed before sending.
