# <backend> — Backend Development Guide

Backend-specific guidance for Claude Code when working in `<backend>/`. The root `CLAUDE.md` and the rules in
`.claude/rules/` (especially `50-backend.md` and `60-database-and-migrations.md`) apply in full.

<Backends: several → one paragraph: what this backend serves, the database and credentials it holds (by name),
which backends it calls and which may call it, matching the backends table in the root guide. It imports no
other backend's code (`10-repo-structure.md`, "Several backends"). Delete with one backend.>

## HARD RULE: The Production Database Is Out of Reach

Claude never connects to a production database: no writes and no reads (no `SELECT`, no `EXPLAIN`, no schema
inspection), not even if the owner asks. When a task needs production facts, write the query and hand it over;
the owner runs it. Identify the environment of any connection string before running anything against it. Full
rule: `95-security-and-privacy.md`, "Production is out of reach".

## Check before you build

Read `src/utils/INDEX.md` and `src/constants/INDEX.md` (generated, `yarn gen:index`) before adding anything. If
something close exists, reuse or extend it.

| Directory | What's inside |
| --- | --- |
| `src/utils/<purpose>/` | every helper, by purpose (full map in `src/utils/README.md`) |
| `src/prisma/selects/` | reusable leaf selects |
| `src/constants/<domain>/` | config values, `UPPER_SNAKE.ts` |
| `<shared>/server/` | code two or more backends run <Backends: several only; delete this row otherwise> |

A type or schema the clients also see belongs in `<shared>/models`, never defined locally here.

## Folder layout

```
<backend>/src/
├── app.ts
├── environment/envVariables.ts
├── constants/<domain>/
├── middleware/{auth,security,request}/
├── routes/v1/
├── controllers/v1/<audience>/<domain>/
├── prisma/{prisma.ts,selects/}
├── utils/<purpose>/
└── workers/<name>/{run.ts,helpers/}
```

## Routing

- `/v1/public/*` unauthenticated · `/v1/<audience>/*` `verifyJwt` + capability gate · webhooks mounted directly in
  `app.ts`, never versioned.

## Error codes

Defined in `<shared>/models/src/constants/ERROR_CODES.ts`. `< 1000` reserved for system errors; domain errors
`>= 1000` in blocks: <domain A> 1000s, <domain B> 1100s, …

## Project-specific invariants

<One bullet per rule a reviewer would otherwise miss: the one writer of a column family, the one predicate file
for an entity's state, the one charger, the one sender. Each with its date or incident id.>

## Common gotchas

<Dated bullets.>

See `README.md` for commands.
