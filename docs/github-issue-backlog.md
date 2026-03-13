# GitHub Issue Backlog For Architecture Improvements

Prepared for: `uxmohamed/caddy`  
Primary contact: `@uxmohamed`  
Target issues page: [https://github.com/uxmohamed/caddy/issues](https://github.com/uxmohamed/caddy/issues)

## Notes
- This workspace does not have an authenticated GitHub client configured, so these issues are drafted here for manual posting.
- The issue set is based on the architecture review of [`docs/system-architecture.mmd`](./system-architecture.mmd) plus the follow-up risks identified during review.
- The default owner/contact is `@uxmohamed`, based on [`CODEOWNERS`](../CODEOWNERS).
- These drafts are written so each section can be copied directly into a GitHub issue.

## Recommended Posting Order
1. Auth: replace raw service-role fallback for Bearer token requests with a constrained request context
2. Data consistency: namespace persisted query cache by user and tighten Realtime reconciliation rules
3. Jobs: add durable dedupe and terminal failure handling for QStash-driven workers
4. Billing: make frontend billing state reactive using user_billing change invalidation
5. Extension auth: harden postMessage bridge with nonce-bound handshake and replay protection
6. Auth: add scoped extension token lifecycle management (scope, revocation, rotation, install metadata)
7. Async UX: expose post-save processing progress and failures for link enrichment
8. Async correctness: define ownership and conflict rules between extension recovery and queued enrichment jobs
9. Performance: formalize hot-path link query strategy and extend indexing/search documentation
10. Billing: validate Lemon test/live environment isolation and document webhook-mode safety
11. Cleanup: remove or gate the example PostHog API route from the production surface
12. Docs: document extension storage strategy and rationale for not using chrome.storage.session

---

## Issue 1

**Title**  
Auth: replace raw service-role fallback for Bearer token requests with a constrained request context

**Type**  
Security / Platform

**Priority**  
P1

**Suggested labels**  
`security`, `auth`, `backend`, `architecture`

**Repo**  
`uxmohamed/caddy`

**Primary contact**  
`@uxmohamed`

**Background**  
The current auth path distinguishes between session-cookie requests and Bearer-token requests, but the Bearer-token path is elevated to a service-role Supabase client inside the shared data-access helper.

**Problem statement**  
`createDataClientForRequest()` returns `createAdminClient()` whenever an `Authorization: Bearer ...` header is present. That bypasses RLS and makes route-layer authorization the only effective guardrail for extension-originated traffic.

**Why this matters**  
This is the highest blast-radius trust boundary in the app. A missed filter, an incorrectly reused helper, or a future route that assumes the data client is user-scoped can create a privilege-escalation path.

**Proposed direction**  
- Introduce a typed request context, e.g. `createRequestContext(request)`, that resolves:
  - actor identity
  - auth source (`session` vs `api_token`)
  - token metadata
  - scopes
  - constrained data accessor
- Stop exposing the raw service-role client as the default Bearer-path query client.
- If elevated access is still required in specific flows, keep it behind explicit helper methods or RPC-like boundaries instead of a generic “admin client for all Bearer traffic” pattern.

**Related files**  
- `src/lib/supabase/server.ts:45-83`
- `src/lib/auth-middleware.ts:17-39`
- `src/lib/auth-middleware.ts:46-109`
- `docs/system-architecture.mmd`

**Dependencies**  
None.

**Acceptance criteria**  
- Bearer-token requests no longer transparently receive a general-purpose service-role client.
- Route handlers can consume a shared request context abstraction instead of manually mixing auth and client selection.
- The new abstraction makes auth source explicit.
- Any remaining elevated access paths are documented as intentional.

**Validation / test scenarios**  
- Valid session request succeeds with session-scoped access.
- Valid Bearer-token request succeeds only for explicitly allowed operations.
- Invalid or expired token returns `401` and never falls back to session auth.
- A route using the new context cannot accidentally read cross-user data without an explicit elevated path.

**Notes / non-goals**  
This issue is about narrowing the blast radius, not replacing Supabase or rewriting the entire auth stack.

---

## Issue 2

**Title**  
Auth: add scoped extension token lifecycle management (scope, revocation, rotation, install metadata)

**Type**  
Security / Auth

**Priority**  
P1

**Suggested labels**  
`security`, `auth`, `extension`, `backend`

**Repo**  
`uxmohamed/caddy`

**Primary contact**  
`@uxmohamed`

**Background**  
Extension auth uses long-lived opaque tokens stored hashed in `api_tokens`, with `expires_at` and `last_used_at`, but the current model does not expose a stronger capability boundary.

**Problem statement**  
Tokens act as bearer credentials with broad implicit power. There is no explicit scope model, per-install metadata, or documented rotation path.

**Why this matters**  
This makes incident response, permission narrowing, and safe token evolution harder as extension usage grows.

**Proposed direction**  
- Extend token records with fields such as:
  - `scope`
  - `revoked_at`
  - `client_id` or install identifier
  - richer lifecycle metadata
- Enforce token scopes in auth checks and route families.
- Support token rotation and a clean reconnect flow for the extension.
- Keep opaque tokens; do not migrate to JWTs as part of this work.

**Related files**  
- `src/lib/auth-middleware.ts:41-109`
- `src/app/api/extension/authorize/route.ts:14-100`
- `src/app/api/auth/tokens/route.ts:70-138`
- `src/app/api/auth/tokens/[id]/route.ts:10-48`
- `extension/src/lib/storage.ts:20-226`

**Dependencies**  
Issue 1 should shape how token metadata is enforced.

**Acceptance criteria**  
- Token records support explicit scope or capability metadata.
- Token auth checks enforce scope for route families.
- Revoked tokens fail deterministically.
- A rotation path exists and is documented.

**Validation / test scenarios**  
- A read-only token cannot hit a write route.
- A revoked token returns `401`.
- Rotating a token invalidates the old one and accepts the new one.
- Extension reconnect UX remains clear after token invalidation.

**Notes / non-goals**  
Do not replace opaque tokens with JWTs in this issue.

---

## Issue 3

**Title**  
Billing: make frontend billing state reactive using user_billing change invalidation

**Type**  
UX / Platform

**Priority**  
P1

**Suggested labels**  
`billing`, `frontend`, `realtime`, `ux`

**Repo**  
`uxmohamed/caddy`

**Primary contact**  
`@uxmohamed`

**Background**  
Billing state currently reaches the frontend via `GET /api/billing/status` and optional `POST /api/billing/sync`, with the dashboard using a `billing_success=1` return-param workflow after checkout.

**Problem statement**  
After checkout or webhook processing, the UI can remain stale until a manual sync or navigation-triggered refetch occurs.

**Why this matters**  
This creates avoidable “I paid but the UI still looks locked” moments and adds more special-case logic to the dashboard.

**Proposed direction**  
- Add a reactive invalidation path for `user_billing` changes.
- The simplest implementation is a Supabase Realtime subscription on `user_billing` that invalidates the billing-status query.
- Keep `POST /api/billing/sync` as a fallback for delayed webhooks, but remove reliance on it for normal freshness.
- Simplify or demote the `billing_success=1` workflow to presentation-only if possible.

**Related files**  
- `src/components/dashboard-shell.tsx:124-193`
- `src/components/settings/settings-billing.tsx:87-207`
- `src/app/api/billing/status/route.ts`
- `src/app/api/billing/sync/route.ts`
- `src/app/api/webhooks/lemonsqueezy/route.ts:7-52`
- `src/lib/billing/webhook-handler.ts:371-420`

**Dependencies**  
None.

**Acceptance criteria**  
- Billing UI updates without requiring a manual refresh after webhook state changes.
- The existing `billing_success=1` flow becomes optional or purely presentational.
- `SettingsBilling` and dashboard warning state converge on one freshness strategy.

**Validation / test scenarios**  
- Simulated webhook changes `user_billing`, and the active UI updates promptly.
- Delayed webhook delivery still leaves the manual sync path as a fallback.
- Stale billing state is cleared when the user downgrades or payment fails.

**Notes / non-goals**  
This issue is about state propagation, not changing the billing provider.

---

## Issue 4

**Title**  
Async UX: expose post-save processing progress and failures for link enrichment

**Type**  
UX / Backend

**Priority**  
P2

**Suggested labels**  
`ux`, `async-jobs`, `links`, `frontend`

**Repo**  
`uxmohamed/caddy`

**Primary contact**  
`@uxmohamed`

**Background**  
`POST /api/links` returns `processing_state`, but the non-blocking `after()` branch can fail silently for auto-forwarding, QStash publishing, or extension recovery.

**Problem statement**  
Users can see a successful save while enrichment or forwarding fails with no visible signal beyond logs.

**Why this matters**  
Silent async failure erodes trust and makes support/debugging harder.

**Proposed direction**  
- Turn `processing_state` into a durable, user-visible status model.
- Track state transitions such as:
  - queued
  - processing
  - completed
  - failed
- Expose meaningful UI status in link rows or detail views.
- Distinguish enqueue failures from downstream processing failures where useful.

**Related files**  
- `src/features/links/api/handlers/create-link.handler.ts:546-820`
- `src/features/links/api/handlers/create-link.handler.ts:716-769`
- `src/features/links/api/handlers/create-link.handler.ts:772-803`
- `src/lib/job-queue.ts:52-220`
- `src/components/dashboard-client.tsx`

**Dependencies**  
Pairs well with Issues 5 and 6.

**Acceptance criteria**  
- Saved links show a meaningful processing state beyond the initial API response.
- Failed enrichment or forwarding can be surfaced to the user or at least made inspectable.
- Async state transitions are represented in data, not only logs.

**Validation / test scenarios**  
- Enrichment success moves a link from queued to complete.
- Enqueue failure marks a visible recoverable failure.
- Extension save path behaves consistently with the web save path.

**Notes / non-goals**  
This issue does not make enrichment synchronous.

---

## Issue 5

**Title**  
Data consistency: namespace persisted query cache by user and tighten Realtime reconciliation rules

**Type**  
Platform / Correctness

**Priority**  
P1

**Suggested labels**  
`frontend`, `cache`, `realtime`, `data-consistency`

**Repo**  
`uxmohamed/caddy`

**Primary contact**  
`@uxmohamed`

**Background**  
The app uses TanStack Query, IndexedDB persistence, and Supabase Realtime together.

**Problem statement**  
The persisted cache key is global (`tanstack-query-cache-v2`), while Realtime updates patch in-memory cache after hydration. This creates risk for cross-user cache bleed and stale hydration behavior.

**Why this matters**  
These are subtle bugs that are hard to reproduce, especially across logout/login, multi-account testing, or reconnect paths.

**Proposed direction**  
- Namespace persisted cache keys by user identity and schema version.
- Define when the Realtime layer should patch versus invalidate query keys.
- Add reconnect/resync rules so stale IDB state is not trusted blindly after disconnects.
- Preserve the value of persistence, but reduce its blast radius.

**Related files**  
- `src/lib/query/persister.ts:4-25`
- `src/lib/query/provider.tsx`
- `src/lib/query/auth-reset.ts`
- `src/features/links/hooks/use-realtime-sync.hook.ts:320-404`

**Dependencies**  
None.

**Acceptance criteria**  
- Persisted cache keys are scoped by user identity and schema version.
- Account changes cannot hydrate another user’s cached server state.
- Realtime strategy is documented: patch only where safe, invalidate otherwise.
- Reconnect behavior includes a deterministic freshness recovery step.

**Validation / test scenarios**  
- Log out and log in as another user without cache bleed.
- Disconnect and reconnect Realtime without stale list corruption.
- Persisted cache still improves cold-start UX for approved query sets.

**Notes / non-goals**  
Do not remove TanStack Query persistence outright without measuring the tradeoff.

---

## Issue 6

**Title**  
Jobs: add durable dedupe and terminal failure handling for QStash-driven workers

**Type**  
Reliability / Backend

**Priority**  
P1

**Suggested labels**  
`backend`, `async-jobs`, `reliability`, `qstash`

**Repo**  
`uxmohamed/caddy`

**Primary contact**  
`@uxmohamed`

**Background**  
Job routes verify QStash signatures and retry on `500`, but the durable “already processed this exact job” contract is not explicit across all job types.

**Problem statement**  
Retries plus model calls plus repeated writes can still cause duplicated or conflicting work unless each job is durably idempotent and has a terminal failure state.

**Why this matters**  
This is the classic “at least once delivery” problem. Without durable dedupe, jobs become a source of silent data drift.

**Proposed direction**  
- Add DB-backed dedupe keys per job type.
- Add terminal failure or dead-letter handling after repeated failure.
- Use UPSERT-safe writes and explicit completion markers for:
  - metadata enrichment
  - AI tagging
  - AI vision tagging
  - bookmark import jobs

**Related files**  
- `src/lib/job-queue.ts:52-220`
- `src/app/api/jobs/enrich-metadata/route.ts`
- `src/app/api/jobs/enrich-ai-tags/route.ts`
- `src/app/api/jobs/enrich-ai-vision-tags/route.ts`
- `src/app/api/jobs/process-bookmark-import/route.ts:1-41`
- `src/features/links/api/handlers/create-link.handler.ts:716-769`

**Dependencies**  
Works well with Issue 4.

**Acceptance criteria**  
- Reprocessing the same logical job does not duplicate side effects.
- Each job type has a durable completion check.
- Repeated failures eventually move to a terminal, inspectable state.
- Operators can distinguish transient retry from terminal failure.

**Validation / test scenarios**  
- Replay the same QStash payload multiple times; side effects happen once.
- Force repeated failure; job stops blind infinite retry and becomes inspectable.
- Parallel duplicate delivery does not create duplicate writes.

**Notes / non-goals**  
Signature verification already exists; keep it, but do not treat it as a substitute for job idempotency.

---

## Issue 7

**Title**  
Extension auth: harden postMessage bridge with nonce-bound handshake and replay protection

**Type**  
Security / Extension

**Priority**  
P1

**Suggested labels**  
`security`, `extension`, `auth`

**Repo**  
`uxmohamed/caddy`

**Primary contact**  
`@uxmohamed`

**Background**  
The content script currently verifies origin and host, then forwards `CADIE_AUTH_SUCCESS` if a token is present.

**Problem statement**  
The bridge relies on origin checks and a local `authProcessed` flag, but it does not bind the auth response to a one-time nonce or install-specific handshake.

**Why this matters**  
This is already a pragmatic pattern, but it remains the highest-risk browser boundary in the extension auth flow.

**Proposed direction**  
- Add a nonce or state token created by the extension.
- Pass it through the `/extension/authorize` flow.
- Require a one-time match before accepting auth completion.
- Keep current origin checks, but make the handshake explicitly single-use and replay-resistant.

**Related files**  
- `extension/src/content.ts:728-808`
- `extension/src/background.ts`
- `src/app/extension/authorize/page.tsx`

**Dependencies**  
Align with Issue 2 if token rotation metadata is added.

**Acceptance criteria**  
- Auth completion requires a valid nonce/state match.
- Replayed `postMessage` payloads are rejected.
- The bridge continues to work across the current content-script and DOM-fallback flows.

**Validation / test scenarios**  
- Valid handshake succeeds.
- Replayed old payload fails.
- Wrong origin or wrong nonce fails.

**Notes / non-goals**  
Do not change the core opaque-token model in this issue.

---

## Issue 8

**Title**  
Async correctness: define ownership and conflict rules between extension recovery and queued enrichment jobs

**Type**  
Correctness / Backend

**Priority**  
P2

**Suggested labels**  
`backend`, `async-jobs`, `extension`, `data-consistency`

**Repo**  
`uxmohamed/caddy`

**Primary contact**  
`@uxmohamed`

**Background**  
Extension saves can trigger both the normal QStash enrichment path and the extension-only recovery path.

**Problem statement**  
The system has two different asynchronous writers that may update overlapping metadata fields on the same link.

**Why this matters**  
Conflicting async writers can create hard-to-explain last-write-wins bugs and nondeterministic metadata.

**Proposed direction**  
- Define ownership by field or by stage.
- Either make recovery only fill missing fields, or make it set a version marker that queued jobs must respect.
- Document precedence rules explicitly so final link state is deterministic.

**Related files**  
- `src/features/links/api/handlers/create-link.handler.ts:736-752`
- `src/features/links/api/handlers/create-link.handler.ts:748-758`
- `src/features/links/services/metadata.service.ts`
- `src/features/links/services/ai-tagging.service.ts`

**Dependencies**  
Related to Issue 6.

**Acceptance criteria**  
- Each metadata field has a documented owner and update rule.
- Recovery and queued jobs cannot clobber each other unpredictably.
- Re-running one path after the other yields deterministic data.

**Validation / test scenarios**  
- Extension save with delayed QStash still produces stable final metadata.
- Recovery path fills gaps without regressing later full enrichment.
- Duplicate replays do not cause metadata oscillation.

**Notes / non-goals**  
This is about write-order discipline, not changing extension UX.

---

## Issue 9

**Title**  
Performance: formalize hot-path link query strategy and extend indexing/search documentation

**Type**  
Performance / Platform

**Priority**  
P2

**Suggested labels**  
`performance`, `database`, `links`, `search`

**Repo**  
`uxmohamed/caddy`

**Primary contact**  
`@uxmohamed`

**Background**  
The repo already has performance indexes, but the architecture review surfaced that the long-term strategy for list filtering and search is not yet explicitly defined.

**Problem statement**  
The current path is serviceable, but the hottest route family (`GET /api/links` and related filters/search) needs a documented query plan and future search direction before scale turns this into reactive firefighting.

**Why this matters**  
Link retrieval and search will become the first sustained performance bottleneck.

**Proposed direction**  
- Document existing hot-path indexes.
- Measure current query patterns.
- Decide whether indexed Postgres reads remain sufficient or whether a more explicit text-search path is needed.
- Capture any additional missing indexes only after measurement.

**Related files**  
- `supabase/migrations/20260213_add_performance_indexes.sql:1-22`
- `src/app/api/links/route.ts`
- `src/features/links/api/handlers/get-links.handler.ts`
- `src/features/links/services/link.service.ts:10-24`

**Dependencies**  
None.

**Acceptance criteria**  
- Existing hot-path indexes are documented.
- Current `GET /api/links` query shapes are enumerated and measured.
- A chosen near-term search strategy is documented.
- Any missing indexes identified by measurement are captured in follow-up work.

**Validation / test scenarios**  
- Benchmark active-link list, duplicate detection, and search-heavy requests on realistic data volume.
- Confirm no regression for extension-driven save dedupe.

**Notes / non-goals**  
This issue starts with measurement and strategy, not immediate migration to a dedicated search service.

---

## Issue 10

**Title**  
Cleanup: remove or gate the example PostHog API route from the production surface

**Type**  
Cleanup / Backend

**Priority**  
P3

**Suggested labels**  
`cleanup`, `analytics`, `backend`

**Repo**  
`uxmohamed/caddy`

**Primary contact**  
`@uxmohamed`

**Background**  
The repo contains an example route that explicitly says it should be deleted if unused.

**Problem statement**  
A demo route under `/api/analytics/example` remains in the live API tree, which increases surface area and can confuse future contributors about supported endpoints.

**Why this matters**  
This is small, but it is exactly the kind of route that lingers and creates avoidable maintenance burden.

**Proposed direction**  
- Either delete the route,
- or gate it behind a development-only guard,
- or explicitly document it as internal-only if it is intentionally retained.

**Related files**  
- `src/app/api/analytics/example/route.ts:5-56`
- `docs/system-architecture.mmd`

**Dependencies**  
None.

**Acceptance criteria**  
- The route is either removed, gated, or formally documented as intentional.
- The architecture diagram and docs match the chosen outcome.

**Validation / test scenarios**  
- Production builds no longer expose unused example behavior unintentionally.

**Notes / non-goals**  
This is a hygiene issue, not a business-critical path.

---

## Issue 11

**Title**  
Billing: validate Lemon test/live environment isolation and document webhook-mode safety

**Type**  
Reliability / Docs

**Priority**  
P3

**Suggested labels**  
`billing`, `ops`, `docs`

**Repo**  
`uxmohamed/caddy`

**Primary contact**  
`@uxmohamed`

**Background**  
Checkout logic supports `LEMONSQUEEZY_TEST_MODE`, but the webhook path and operational documentation should make environment isolation explicit.

**Problem statement**  
The current code uses one webhook secret variable and separate provider mode controls, but the deployment safety contract between test/live billing environments is not obvious from the implementation review.

**Why this matters**  
Billing environment misconfiguration is costly and hard to debug.

**Proposed direction**  
- Audit how test vs live checkout and webhook secrets are handled across environments.
- Document the intended deployment split in operational docs.
- If needed, make mode validation explicit in monitoring, logging, or startup checks.

**Related files**  
- `src/lib/billing/lemon-client.ts:136-168`
- `src/app/api/webhooks/lemonsqueezy/route.ts:7-52`
- `src/lib/billing/webhook-handler.ts:115-133`
- `ENV_VARIABLES.md`

**Dependencies**  
None.

**Acceptance criteria**  
- Billing environment behavior is documented clearly.
- Test and production secrets and webhook expectations are unambiguous.
- The team can verify a deployment is wired to the correct Lemon environment.

**Validation / test scenarios**  
- Local test-mode checkout does not create ambiguity with production webhook processing.
- Production environment rejects invalid signatures with the expected secret.

**Notes / non-goals**  
This is an operational safety issue, not a provider migration.

---

## Issue 12

**Title**  
Docs: document extension storage strategy and rationale for not using chrome.storage.session

**Type**  
Docs / Extension

**Priority**  
P3

**Suggested labels**  
`docs`, `extension`, `auth`

**Repo**  
`uxmohamed/caddy`

**Primary contact**  
`@uxmohamed`

**Background**  
The extension stores the token in `chrome.storage.local` and non-sensitive values in `chrome.storage.sync`. The architecture note explicitly says `chrome.storage.session` is not used.

**Problem statement**  
The current implementation is reasonable, but the rationale is mostly implicit in code comments rather than documented as a deliberate storage model.

**Why this matters**  
Without a stated rationale, a future refactor may “simplify” the storage model and break auth persistence or security assumptions.

**Proposed direction**  
- Add a short architecture note covering:
  - why `apiToken` is local-only
  - why `cadieUrl` and `userEmail` are sync-safe
  - why `pendingUrl` is currently persistent
  - whether `chrome.storage.session` is intentionally avoided or simply deferred

**Related files**  
- `extension/src/lib/storage.ts:1-226`
- `extension/src/options/options.ts`
- `docs/system-architecture.mmd`

**Dependencies**  
None.

**Acceptance criteria**  
- Storage choices are documented in one authoritative place.
- The rationale for not using `chrome.storage.session` is explicit.
- Future contributors can change storage with clear tradeoff context.

**Validation / test scenarios**  
- No behavior change required; this is documentation-only.

**Notes / non-goals**  
This issue does not require changing storage behavior by itself.

---

## Cross-Issue Validation Checklist
- One issue exists for each identified problem area in the architecture review.
- Every issue includes owner/contact, file references, acceptance criteria, and test notes.
- The performance issue does not claim that no indexes exist; it starts from the existing index migration and asks for a documented hot-path strategy.
- No issue describes extension auth as JWT-based.
- No issue claims `chrome.storage.session` is currently in use.

## Suggested Manual Posting Workflow
1. Open the target repo issues page.
2. Create issues in the recommended posting order above.
3. Copy each issue section into a new GitHub issue.
4. Apply the suggested labels where they exist, or create them during triage.
5. Add milestone/assignee decisions after initial creation.
