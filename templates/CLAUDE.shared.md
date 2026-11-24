# `@<brand>/models` — the API contract

Single source of truth for the API contract: Zod schemas, DTOs, endpoint request/response types, core enums,
uid schemas, shared constants. Consumed by every app and every backend. `.claude/rules/70-shared-contract.md` and
`40-syntax.md` apply in full.

## HARD RULE: The Production Database Is Out of Reach

Claude never connects to a production database: no writes and no reads (no `SELECT`, no `EXPLAIN`, no schema
inspection), not even if the owner asks. When a task needs production facts, write the query and hand it over;
the owner runs it. Full rule: `95-security-and-privacy.md`, "Production is out of reach".

## Build

Consumers resolve `dist/`, not `src/`: after editing anything here, `yarn build` before a backend typecheck
reflects it; restart apps using it. A new entry point = an `index.*.ts` barrel + an `exports` entry + a build.

## Layout

```
src/
├── core/        permanent: enums, UIDs, time, password, locale, ApiError
├── constants/   ERROR_CODES, …
├── catalogs/    reference data
├── dtos/v1/<group>/
└── endpoints/v1/<group>/      mirrors <backend>/src/controllers/v1/<group>/
```

Entry points: `@<brand>/models/shared` (core + catalogs + constants only), `@<brand>/models/v1/<group>`.

## Rules

- Request and response schemas separate; `<Endpoint>{Body,Query,Params,Response}Schema` + inferred types.
- Enums: `XValues` (`as const`), `XSchema`, `X`; stored enums checked against the database enum at type-check time.
- Back-compat: deployed shapes are frozen; `@deprecated` with reason, default and removal trigger on everything
  kept for old clients; null a field, never delete it. <Clients can be out of date: no → lockstep-deployed groups may drop fields outright.>
- No `node:`, no ORM, no React, no I/O; `zod` is the only dependency.

Find the current removal set: `grep -rn "@deprecated" <shared>/models/src`.
