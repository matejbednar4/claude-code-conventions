# Security and privacy

The global HARD RULES (never leak secrets, devops read-only, strict environment separation, never increase spend)
apply first; this file is the code-level detail. For production databases this file is stricter than read-only:
see "Production is out of reach".

## Secrets

- Secrets never reach tracked files, client bundles (`EXPO_PUBLIC_*` / `NEXT_PUBLIC_*` ship to every device: only
  publishable-class keys belong there), logs, DNS, or any public surface. Server secrets live in the secrets
  manager; CI secrets in the CI's secret store; build secrets in the build service's secrets, and only values safe
  to be built into the app.
- `.env*` stays gitignored; `.env.example` lists names without values. Env variables are declared once and
  validated strictly (see `30-code-structure.md`); messages name variables, never values.
- Never print a secret in a terminal; read it into a variable, show the name or a redacted prefix.
- In code, a secret travels only in the header it belongs in; never in a URL (query strings are logged), never
  in an error message or its `cause`. Tokens in query params are avoided for new endpoints (POST body or header).
- Credentialed requests never follow redirects.
- Treat anything that identifies a person as a secret when in doubt.

## Data and logging

- **Never log** passwords, session tokens, cookies, request bodies that hold user data, credentials, or a request
  URL with its query string. Network failures are logged by error name and code only (Node's own message names
  the address).
- Special-category data (health, financial detail) is on-device or in its own tables with explicit, versioned
  consent; never in analytics payloads, crash reports, docs, comments, fixtures or memory files. Worked examples
  and seeds are invented.
- Production data never appears in any file in the repo, including counts; docs describe a bug's cause in general
  terms.
- Real in-app export and deletion exist before launch for any product holding personal data; deletion
  confirmations that outlive the deleted row are sent directly, not queued.

## Production is out of reach

Claude never touches a production database: no writes, and no reads either. This is stricter than read-only on
purpose: a session that can read production can leak what it read (into a reply, a log, a fixture, a memory
file), and it is one wrong command away from a write.

- **No connection of any kind:** no queries (not even `SELECT` or `EXPLAIN`), no schema inspection, no read-only
  role, no replica, no tunnel, no database dashboard or studio, and no script, worker or admin endpoint that
  queries production on Claude's behalf.
- **No production credentials where Claude can read them.** Local env files hold development values (staging
  only where the owner allows it). A production connection string never sits in the repo, the shell or any file
  Claude opens; if one turns up, don't use it, stop and tell the owner.
- **Identify the environment before running anything against a database**, from the host and database name in
  its connection string. Production, or anything that can't be told apart from it, is a stop.
- **When a task needs production facts**, write the exact query and hand it over. The owner runs it and shares
  only what the task needs: a count, a shape, an invented example in the same form, never personal data.
- **Production problems are debugged from what the owner shares** (logs, error reports) and reproduced locally or
  on staging, never by looking into the production database.
- **Migrations reach production only through the deploy pipeline**, never from a session.

## Access control in code

- IDOR: every user-owned read and write filters by owner; cross-principal keys use the globally unique uid.
- Row-level security on every user-data table when clients reach the database directly; the service role never
  ships to a client.
- Admin surfaces confirm every destructive or money-moving action; admin logins are restricted to the company
  domain plus one-time codes.
- Rate limits on public and authed routes, ordered IP → user → route, backed by shared storage.

## Dependencies and supply chain

- yarn only; exact pins (`save-prefix ""`); shared versions pinned via root `resolutions`; `ignore-scripts true`
  with the few native install steps run deliberately and checksum-verified.
- **Always ask before adding or upgrading a package, and always check the internet first** for bugs,
  vulnerabilities and advisories against the exact version being installed (see `00-working-with-claude.md`);
  publisher, downloads, maintenance and typosquatting too. No exceptions for "small" packages.
- One package index only; workspace names namespaced to prevent dependency confusion.
- With hosted CI (**Repository: on GitHub**), third-party actions never receive secrets: official CLIs or
  official-org actions, version-pinned; if a third-party action is unavoidable, pin it to a full commit SHA with
  the narrowest secret.
- Telemetry and "phone home" features of tools are switched off where the project is privacy-sensitive.

## Outbound calls

- Every host the code calls is listed in the guide with what it sends and why; a new one needs an explicit OK.
  No analytics, error reporting, CDNs or telemetry beyond the approved stack.
- Answers are read with a size cap and validated by schema before use; failures never break a screen (fall back,
  show the built-in state, keep the last copy).
- Nothing fetched ever triggers a write, a payment or an order on its own.

## Payments and money

Applies when **Money: yes** in the root guide.

- Money code changes need explicit approval before editing. Never create ledger events directly; always the
  wrapper functions. Every lock has an unlock path; `externalRef` idempotency on every movement; zero-sum
  integrity for internal transfers; correct account ownership validated before charging or paying.
- Never charge a card twice: effect refs vs attempt refs; an attempt counter advances only when it is certain no
  money moved; ambiguous outcomes defer; only a classified definitive rejection releases locked funds.
- Card charges and order placement happen only in workers under a singleton lock, never inside an HTTP request.
- Payment-provider webhooks verify signatures on the raw body and dedupe by event id.

## Client

- Tokens in secure storage only; never in state, logs or UI. Error messages show no stack traces or internal ids.
- Content-Security-Policy on web surfaces (`connect-src 'self'` where the frontend only talks to its own API);
  no inline scripts; nothing loads before consent where consent is required.

## Repo hygiene

- A pre-commit hook (`scripts/hooks/pre-commit`) refuses commits that add env files, private docs, Claude
  settings, databases, or lines containing listed leak words; installed once per clone with
  `git config core.hooksPath scripts/hooks`.
- `.claude/settings.json` denies reads and edits of private volumes and `~/.ssh`, and keeps the sandbox on. It is
  a guardrail, not a guarantee: follow the rules regardless.
- Remotes, hosting and what never leaves a local-only repo: "Where the repository lives" in
  `10-repo-structure.md`.
