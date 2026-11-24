# CLAUDE.md

This file provides guidance to Claude Code when working in this repository. The conventions live in
`.claude/rules/` (loaded automatically); this file holds what is specific to **this** project. Fill every
`<placeholder>` and delete what does not apply.

## What this is

<One paragraph: the product, who it is for, what it is not. State the positioning sentence that every piece of
copy must respect. Example: "A booking tool for small studios, not a payment processor.">

**<The #1 requirement>.** <One sentence on the thing that matters most here: security, money integrity,
privacy, conversion. Every judgement call defers to it.>

## Project options

Several rule files branch on these lines, so Claude never has to guess them from the code. A section in a rule
file that starts with "Applies when **Option: value**" is skipped when this table says otherwise.

**Every row is the owner's answer, never Claude's guess.** When the kit is copied, Claude asks the owner each row (the
question, the values, what each switches) and writes down only what they answer. A row that still shows `<…>` was
never asked: stop and ask before any work the rule behind it governs.

| Option | Value | What it switches |
| --- | --- | --- |
| **Languages** | <en \| en, <lang>> | one language: no translation layer at all; more than one: section 3 of `90-copy-and-i18n.md` (colocated namespaces, `t()`, key parity) |
| **Frontend apps** | <none \| one \| several> | several: a shared client package and the promotion rule in `80-frontend.md`; one: components stay in the app, no shared client package |
| **Backends** | <none \| one \| several> | none: `50-backend.md`, `60-database-and-migrations.md` and the backend folder guide do not apply; several: one folder and guide per backend, the backends table below, the shared server package and "Several backends" in `10-repo-structure.md` |
| **Shared packages** | <models + sdk + client \| models only \| none> | which layers of `10-repo-structure.md` and `70-shared-contract.md` exist |
| **Clients can be out of date** | <yes (store-distributed) \| no (lockstep, or the server serves the client)> | yes: frozen contracts and `@deprecated` shims in `70-shared-contract.md`; no: rename and remove outright |
| **Database reached by** | <server only \| clients directly> | clients directly: row-level security on every user-data table (`60-database-and-migrations.md`) |
| **Money** | <yes \| no> | yes: the ledger, idempotency and payments sections of `50-backend.md`, `60-database-and-migrations.md` and `95-security-and-privacy.md` |
| **Client platform** | <React Native (Expo) \| web \| both> | which navigation, storage and design-system notes in `80-frontend.md` and `85-design-system.md` apply |
| **Build pace** | <step by step \| all at once> | step by step: Claude stops for review after every step of a multi-layer task; all at once: after the plan is approved, builds every step in flow order and stops only at security boundaries (`00-working-with-claude.md`, "Build in steps") |
| **Repository** | <on GitHub \| local only> | on GitHub: one private `origin`, CI in `.github/workflows/`; local only: no remote ever, nothing from the repo pasted online, no GitHub tooling, checks and deploys run locally (`10-repo-structure.md`, "Where the repository lives") |

Changing an option later (a second language, a second app, a first or second backend) is a decision recorded under
**Decisions** and done in one dedicated pass, never screen by screen.

## Guides per folder

Claude Code loads these automatically when working inside the folder. Keep them current (rule 3 of "Before you
implement anything" in `.claude/rules/00-working-with-claude.md`).

- [<backend>/CLAUDE.md](<backend>/CLAUDE.md): folder layout, controllers, validation, errors, database access
  <Backends: several → one line per backend.>
- [<app>/CLAUDE.md](<app>/CLAUDE.md): screens, components, API calls, busy states, the design system
- [<shared>/CLAUDE.md](<shared>/CLAUDE.md): the API contract (Zod schemas, DTOs, enums) and pure logic both sides run

## Hard rules for this project

The global hard rules (`~/.claude/CLAUDE.md`: never increase spend, devops read-only, verification must be able
to fail, additive migration, never leak secrets, strict environment separation) apply in full, and the production
database is out of Claude's reach completely (`95-security-and-privacy.md`). Project-specific ones:

- <e.g. "Personal data stays on the device unless the user opts in; the hosted database stays in one declared region.">
- <e.g. "Financial code changes need explicit approval before editing.">
- <e.g. "Every admin action is recorded with who did it and why.">

## Project overview

**Stack:** <backend framework + ORM + database> · <app framework> · <shared contract package> · <hosting>

**Environments:** <dev / staging / production, and where each lives>

**Backends:** <Backends: several → one row per backend; delete this table otherwise.> A pair that is not listed
here does not talk (`10-repo-structure.md`, "Several backends").

| Backend | Serves | Holds | Called by |
| --- | --- | --- | --- |
| <backend> | <the audiences it answers> | <its database and credentials, by name, never a value> | <the backends allowed to call it, or none> |

**Glossary:** one word per concept, the same in code, API, screens and docs (`90-copy-and-i18n.md`).

| Word | Means | Never |
| --- | --- | --- |
| <term> | <what it is> | <the synonyms that must not appear> |

**Out of scope:** <features that exist in code but must not be extended or surfaced>

## Repo structure

```
<repo>/
├── <backend>/           <one line> <Backends: several → one entry per backend, or <surface>/server + <surface>/client>
│   └── src/
│       ├── constants/   static values by domain (auth/, billing/, …), UPPER_SNAKE.ts
│       ├── controllers/ request handlers by audience and domain
│       ├── middleware/  auth/, security/, request/
│       ├── routes/      routers, one per resource
│       ├── utils/       helpers by purpose (core/, money/, hydrators/, …; map in utils/README.md, manifest in utils/INDEX.md)
│       └── workers/     background jobs, one folder per worker
├── <app>/               <one line>
│   ├── app/             file-based routes only (screens + _layout files)
│   ├── components/      app-specific components
│   ├── contexts/ hooks/ providers/ utils/
├── <shared>/
│   ├── models/          Zod DTOs, endpoint schemas, enums, constants
│   ├── sdk/             typed API client functions
│   ├── client/          design system + cross-app client utilities
│   └── server/          code two or more backends run <Backends: several only; delete otherwise>
└── docs/                deep-dives referenced from the folder guides
```

**Build order:** `<shared>/models` → `<shared>/server` (if there is one) → backends and apps.

## Commands

```bash
yarn install                 # from the repo root only
yarn typecheck               # <where>
yarn lint
yarn test                    # <what is covered; every check must be able to fail>
yarn gen:index               # regenerate utils/INDEX.md + constants/INDEX.md after adding/removing/renaming one (in each backend)
```

## Key patterns to follow

**New endpoint:** one change, two steps. First the plumbing: schema in `<shared>/models/src/endpoints/`, route
line with validation middleware in `<backend>/src/routes/`, SDK function in `<shared>/sdk/`, exports through the
right barrel. Then the controller in `<backend>/src/controllers/`.

**Schema change:** edit the schema, generate the migration (never hand-write it unless the tool cannot express
it), regenerate the client and types. Ask first; see `.claude/rules/60-database-and-migrations.md`.

## Common gotchas

<Add one bullet per sharp edge as it is discovered. Each carries its date and, if it caused an incident, an id
(`E012`-style) so it can be referenced from code comments. Never delete one that still applies.>

## Decisions

<Dated one-liners: "2026-01-15: Dates are shown in the viewer's time zone, never UTC." A decision that was
reversed stays, with the reversal under it.>
