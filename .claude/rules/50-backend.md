---
paths:
  - "<backend>/**"
  - "<shared>/server/**"
---

# Backend

Applies when **Backends** is not `none` in the root guide. With **Backends: several**, every rule here applies
inside each backend on its own; how the backends sit together is "Several backends" in `10-repo-structure.md`.
Adjust folder names to the project. The money-related rules (idempotency, ledger, charges in workers) apply when
**Money: yes**.

## Three-layer endpoint architecture

Every endpoint has three layers, changed together in one change (one PR, built in two steps: the plumbing of
contract, route line and SDK first, then the controller; see "Build in steps" in `00-working-with-claude.md`):

1. **Contract** (`<shared>/models/src/endpoints/<version>/<audience>/<domain>/<endpoint>.ts`): Zod request and
   response schemas and their types.
2. **SDK** (`<shared>/sdk/src/endpoints/<version>/<audience>/<endpoint>.ts`): one function per endpoint, named
   like the controller, naming the method, path and schemas, calling the one `request` wrapper that validates the
   request before sending and the response after.
3. **Server**: a route line with validation middleware, and the controller in
   `controllers/<version>/<audience>/<domain>/<verbNoun>.ts`.

```ts
r.get("/search", validateReq("query", GetAccountsFromSearchQuerySchema), getAccountsFromSearch);
```

## Folder layout

```
src/
├── app.ts            global middleware, mounts routes, serves health; webhooks mounted outside the versioned router
├── environment/      envVariables.ts: the only reader of process.env
├── constants/        <domain>/UPPER_SNAKE.ts
├── middleware/       auth/ (verifyJwt, requireCapability, requireRole) · security/ (rateLimit, enforceMinVersion) ·
│                     request/ (validateRequest, errors) · never versioned
├── routes/           <version>/ routers per resource, each index.ts starting with a docblock listing its endpoints
│                     (`METHOD /path` — what it does); webhooks/ permanent
├── controllers/      <version>/<audience>/<domain>/<verbNoun>.ts, one per file; webhooks/ permanent
├── prisma/           prisma.ts (the client) · selects/ (reusable leaf selects)
├── db/               query-builder client + generated types
├── utils/            <purpose>/ (core/, formatting/, clients/, auth/, money/, pricing/, hydrators/, …) — map in
│                     utils/README.md, manifest in utils/INDEX.md
├── workers/          one folder per worker: run.ts + helpers/; shared runtime/ framework
└── seed/             dev seeding only
```

- **Routes:** one router per resource; a fixed path is registered before a parameter path with the same method
  (`/items/from/:uid` before `/items/:uid`). Global middleware stays in `app.ts`; middleware for one group goes
  at that group's mount. A new route under an authed group is protected without doing anything; making a path
  public is an explicit addition.
- **Controllers:** one per file, typed as the framework's handler, wrapped in `asyncHandler`. Structure: (1) read
  validated input and the principal, (2) business logic with proper errors, (3) typed response with `satisfies`.
  Docblock first line `` `METHOD /path` — what it does ``, then the flow and non-obvious rules.
- **Utilities:** by purpose; name throwing ones `OrThrow`; `generateUid("PREFIX")` for identifiers.

## Validation and access

- **Every request is validated with the shared Zod schema** via `validateReq("body" | "query" | "params", Schema)`
  on the route; controllers read `req.validatedBody` / `validatedQuery` / `validatedParams`, never raw `req.body`.
- **IDOR protection: always filter by owner.** `findFirst({ where: { id, ownerId: req.user.id } })`, never
  `findUnique({ where: { id } })` on a user-owned resource. A mount with no capability gate must assert the entity
  in the handler.
- **Principal ids are per-table primary keys; the capability gate is what makes `req.user.id` safe.** Anything
  keyed on the principal across principal types (rate-limit buckets, cache keys, dedupe keys) uses the globally
  unique `uid`, never the integer id. Never add an admin capability to a user-scoped allow-list.
- Auth is bearer-token (`Authorization: Bearer <jwt>`), capability in the token (one value per
  `<audience>`), role checks after capability checks. Cookies and CORS only if a browser surface genuinely needs them.
- With **Backends: several**, a backend that calls another is an audience like any other: its own credential and
  capability, checked on every call. Being on the same host or network proves nothing.
- Rate limiting is layered and ordered: IP limits before authed-user limits before per-route limits; keyed on
  `uid`; backed by shared storage (Redis or the equivalent) so it holds across instances; fails open.

## Errors

- **Error codes under 1000 are reserved for generic/system errors** (SDK 1–70, server 100–310: auth, OTP,
  validation, rate limit, not found). **Domain errors are ≥ 1000**, grouped per domain in blocks, defined once in
  the shared `ERROR_CODES` constant so two errors can't share a code. Worker terminal failures use their own block
  (8xxx).
- `throw createCustomError(code, message, status)` from `utils/core/errors/`. Options form for `{ permanent }`
  (fail a job terminally), `{ expected }` (mute a benign tracker report), `{ cause }` (root cause for the tracker,
  never leaked to the client), `{ notify, notifyKey }` (deduped team alert for money-integrity invariants only).
- **Response shape, every success:** `{ message, <named payload> }`. **Every error:** `{ error: { code, message,
  errors?: [{ path, message }] } }`, produced by one central error handler that never sends internals (stack
  traces, SQL, file paths) to the client.
- **Every error message is a plain sentence the user can read in the app**: what went wrong and, where possible,
  what to do ("That email is already registered. Log in instead."). In a one-language app the client shows it
  as-is, so write it for the screen, never for a developer. Internals go in `cause` (server log / tracker only).
  Never log a request URL with its query string (query strings carry tokens); never log tokens, passwords,
  bodies, credentials.
- All errors ship to one observability sink (`reportError`); the central handler and the worker runtime call it.
  Never call the tracking client directly; the classifier is `track = !expected`.

| Status | Use |
| --- | --- |
| 200 | GET/PUT/PATCH success |
| 201 | POST created |
| 202 | background job started |
| 204 | DELETE with no content |
| 304 | cache hit (ETag) |
| 400 | validation error |
| 401 | authentication |
| 403 | authorization |
| 404 | not found |
| 409 | conflict (duplicate, invalid state, CAS lost) |
| 413 | body too large |
| 429 | rate limited |
| 500 | unexpected (details only server-side) |
| 502 | upstream unreachable or refused |
| 503 | dependency unavailable |

## Concurrency and integrity

- **Atomic claims, never find-then-update:** `updateMany({ where: { id, ownerId, status: "PENDING" }, data: {
  status: "PROCESSING" } })`; `count === 0` → 409. Whoever loses the claim must not move money or release locks.
- **Handle `P2002` (unique violation) for races**: let the database decide, then word its refusal as a 409 with a
  domain code. Don't check-then-write.
- **Idempotency everywhere money or external calls are involved:** a deterministic `externalRef` / idempotency key
  per effect ("once ever") or per attempt ("one try"), persisted before the call, never recomputed; the retried
  request body byte-identical. An ambiguous outcome (timeout, 5xx) **defers and re-verifies**; only a definitive
  rejection advances an attempt counter.
- **Two-phase init/confirm** for uploads and complex creations: init creates a pending row with `expiresAt` and
  returns presigned URLs; confirm CAS-claims the pending row, promotes, creates the final record, deletes the
  pending row; on failure best-effort cleanup then rethrow.
- **Cleanup:** on success delete temporary resources; on failure best-effort cleanup that never masks the original
  error (`.catch(() => {})`).
- **Transactions:** `prisma.$transaction(async (tx) => …)`; a util that may run inside one takes `tx` first.
  Never wait on anything but the database inside a transaction (no `fetch`, timers).
- Nothing that charges a card or places an order runs inside an HTTP request; the endpoint records intent, a
  worker under a singleton lock does the money.

## Hydrators (DB → DTO)

- **A hydrator never throws on corrupt or unexpected stored data.** Retrying can't fix the row, so the screen (or
  the whole app, for a session hydrator) would never load again. Validate at the write boundary once; read as-is
  downstream (cast if the column type is wider). A genuinely unconstrained field degrades (default, `null`, drop)
  and logs the anomaly. The one legitimate throw is "not found" (404) for the root entity.
- Audience gates are enforced in the hydrator too (defense in depth): spread the canonical visibility predicate
  into its query so a caller that forgets the filter gets a short list, not a leak.
- Generic leaf selects live in `prisma/selects/`; a DTO-shaped composite select is inlined in its hydrator
  (single-use) until a second caller appears.
- Computed values are computed at read time with the shared functions, never stored; the frontend runs the same
  functions, so screen and server can't disagree.

## Workers

- `workers/<name>/run.ts` (self-executing) + `helpers/`. **Built on the shared `runtime/` framework:** no worker
  has its own `while` loop, SIGTERM handler, retry block, claim CAS or `console.*`. Domain-poll workers use
  `runWorkerLoop` (graceful shutdown, idle pacing, backoff, optional advisory-lock singleton); queue workers use
  `runJobQueue` (claim → execute → markDone, jittered backoff, `DeferJob`). Log through `workerLogger(name)`.
- Tunables in `constants/workers/<WORKER>.ts`, `satisfies WorkerLoopTunables`.
- Workers import `utils/` and `constants/` like everything else and never ride a client cutover.

## Shared state and caching

- Many processes run (auto-scaled API + worker tasks): cross-instance state (rate limits, locks, token buckets)
  lives in shared storage (Redis or the equivalent), never a module-level `Map`. Heavy repeated computation is cached read-through with a generation
  counter bumped by every writer that feeds it.
- **Always fail open:** a shared-storage outage costs performance, never correctness or availability.
- Every third-party client singleton (`utils/clients/`) sets explicit timeouts; the SDK defaults are unbounded.

## Outbound calls

- Every outbound answer is read with a size-capped reader (`readJsonOrThrow`), never `response.json()`; validated
  by a tolerant schema (only the fields used) before use; unknown shapes stored/listed as oddities, never guessed
  at.
- Credentials travel only in the header they belong in, never in a URL, log, error or cause. Never follow a
  redirect with a credentialed request (`redirect: "manual"`, 3xx refused).
- Requests are spaced under each service's limit; a dropped connection before any answer may be retried, a
  timed-out write never blindly (look the outcome up first).
- A new outbound call to a new host needs an explicit OK and is recorded in the guide with what it sends and why.

## Notifications and email

- One sender function per channel family (`queueNotificationJobs`), one audience per call, always a `dedupeKey`
  (day-bucketed for bursty events), never throws (reports and returns 0). Pass `tx` when the notification must be
  atomic with a state change (outbox).
- Event slugs and display metadata live in one shared catalog; templates in one constants file; adding an event
  touches both and nothing else. Preferences are opt-out: a missing row means on.
- Escape payload values in HTML bodies; never in plain-text parts. Every email is multipart. One CTA per email.

## Webhooks

- Verify signatures with the raw body; check idempotency by external event id before processing; return 200 once
  recorded. Mounted outside the versioned router, URLs frozen forever.
- The dispatcher's catch rethrows `CustomError`s intact and wraps only unknown throws.

## Common anti-patterns (the review catches these most)

raw `req.body` · a missing ownership filter · find-then-update state changes · missing cleanup on the failure
path · an external system's shape outside its adapter · waiting on the network inside a transaction · editing an
applied migration · a config value hardcoded outside `constants/` · a hydrator that throws on stored data ·
logging a secret, an address or a query string · a hand-rolled worker loop.
