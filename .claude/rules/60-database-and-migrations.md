---
paths:
  - "<backend>/**"
  - "**/prisma/**"
  - "**/supabase/**"
  - "**/migrations/**"
---

# Database design and migrations

Applies when **Backends** is not `none` in the root guide; the row-level-security rules when **Database reached
by: clients directly**; the ledger rules when **Money: yes**. With **Backends: several**, each database belongs
to exactly one backend (`10-repo-structure.md`, "Several backends").

**The production database is out of Claude's reach completely**, reads included: see "Production is out of
reach" in `95-security-and-privacy.md`. Everything below is about development and staging databases, and about
the migrations the deploy pipeline carries to production.

## Schema design

- **Every schema design or change comes with a diagram**: an entity-relationship diagram published as an
  Artifact (tables, keys, relations, cardinality). Show it before the migration is generated, and update it
  whenever the schema changes.
- **Tables are plural snake_case, columns snake_case**, mapped explicitly (`@@map` / `@map`) so the ORM model can
  stay camelCase. Field order and comment style follow the header of `schema.prisma`.
- Prefix-namespaced public ids (one prefix per principal type: `<prefix>-…`) next to integer primary keys; anything client-facing or
  cross-entity uses the `uid`. Separate tables for separate principals; never a shared sequence that makes one
  integer mean three accounts.
- **Money is integer cents** in one ledger currency; display conversions happen at read time. The ledger is the
  source of truth for how money moved; derived balances are computed from it or maintained by the ledger helpers
  only. Zero-sum internal transfers are enforced (`enforceZeroSum`).
- **Immutable facts are stamped at creation** (`currencyAtCreation`, the algorithm version on every price row)
  so later reads never re-derive history from mutable state. Histories are append-only tables (`*_changes`), one
  row per change with when it applies and why; the one in force is the latest.
- **State machines have one writer:** the transition helpers in one file; CAS-guarded terminal transitions;
  partial unique indexes for "at most one open per owner".
- A registry that must be "once, ever" (a bonus granted once per account, processed webhook events) is an append-only table with
  a unique key and no delete path.
- **Enums:** the database enum and the shared Zod enum hold the same values, checked at type-check time; a stored
  enum stored as text (SQLite) gains a value with no migration.
- **Indexes:** for every frequently-run query, check the schema has an index for what it filters and sorts by,
  and comment what the index is for. Common shapes: ownership `@@index([ownerId])`, status
  `@@index([status, createdAt])`, uid lookups, composites `@@index([ownerId, status])`, GiST for geography.
- Required extensions (`postgis`, `citext`) are created in the first migration.
- **Row-level security** on every table holding user data when the database is reached directly by clients
  (**Database reached by: clients directly**, e.g. Supabase): users read and write only their own rows; the service role is never used from a client.
- Health data, consent records and anything a regulation names get their own tables with an explicit consent
  timestamp and version column; never mixed into a generic settings blob.

## Migrations

- **Generate migrations from the schema diff; never write the SQL by hand** when the tool can express the change
  (`prisma migrate dev`). Hand-written migrations skip the tool's safety checks and forget schema qualifiers.
  When the tool cannot express something (CHECK constraints, triggers, RLS policies, PostGIS indexes), add it to
  the **generated** migration file, each statement commented with what it enforces.
- If you edit a generated migration (a backfill, splitting a destructive change): qualify every table with its
  schema (`"<schema>"."<table>"`), keep destructive steps separate from additive ones, and never make an applied
  migration's checksum change.
- **Never edit a migration that has been applied anywhere** (staging or production), not even a comment: the
  checksum is recorded and every later deploy drifts. Fix forward in a new migration.
- A migration that rebuilds a table (SQLite) silently drops hand-written rules; re-add them in that migration and
  verify the counts on a throwaway copy.
- **Additive migration, never break prod** (global rule): add columns nullable or with defaults, backfill, then
  tighten; drop only after no reader is left; rename a wire field by adding the new one and retiring the old at
  the next cutover, never in place.
- Seeds are development-only scripts; never run against anything but a local database.
- After a schema change: generate the client (`yarn prisma:generate` / `yarn db:generate`), regenerate query-
  builder types (`yarn db:types`), update the hydrators and DTOs, and the folder guide.

## Querying

- The ORM client comes from one module (`prisma/prisma.ts`); nothing else instantiates one.
- **No raw SQL for table data** (`$queryRaw`, `$executeRaw`, `*Unsafe`): TypeScript can't check it, so a renamed
  column fails at run time. Use the query builder (e.g. Kysely) with generated types, and its `sql` tag only for
  expressions the ORM can't express (PostGIS, window functions). Acceptable exceptions: `SELECT 1` health checks
  and advisory-lock calls.
- Reuse leaf selects from `prisma/selects/`; inline DTO-shaped composites in their hydrator.
- **Let the database decide, then word its refusal:** a `P2002` or a foreign-key violation becomes a 409 with a
  domain code and a sentence for the screen, worded in one place per model. Don't check first and then write.
  `updateMany`/`deleteMany` report "0 changed" for an unknown id; the controller answers 404 itself.
- Transactions: `$transaction(async (tx) => …)`, `tx` as the first parameter of any util that may run inside one;
  never wait on the network inside; everything fetched and computed is ready before the transaction opens.
- Local-only quirks (a local Postgres not on UTC) are documented as local; staging and production are never
  touched to "fix" them.
