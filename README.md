# claude-code-conventions

The rulebook I copy into every new project so that Claude Code works like a careful senior engineer on the team,
not a code generator I hope got it right. It is plain Markdown in `.claude/rules/`, which Claude Code loads
automatically, plus templates for the project guides and two small scripts.

Published in November 2026: a cleaned-up version of the rules I have been building up in my own projects since
December 2025.

**What it makes Claude do:**

- **Ask instead of guess.** The shape of a project (backends, apps, languages, money, GitHub or local only, how
  fast to build) is a short table of options answered once, when the kit is copied. Every rule reads its answer
  from there.
- **Build in the order a developer would:** network, then database schema (with a diagram), then the endpoint
  plumbing, then the logic, then the frontend. It stops for review at every security boundary.
- **Stay inside hard limits:** production databases are out of Claude's reach entirely (not even reads),
  secrets never reach code, logs or app bundles, no dependency is added without a vulnerability check and an OK,
  and every "it works" comes with a check that could have failed.
- **Do each thing one way:** naming, folders, errors, API contracts, design system and copy, so code written in
  different sessions reads like one author wrote it.

**Who it is for:** anyone building a TypeScript product with Claude Code (a backend, one or more apps, a shared
Zod contract between them) who wants the output to be reviewable and consistent from the first commit.

Everything project-specific is a `<placeholder>`; everything that varies between projects is an option in the
root guide. To start, see [Using it in a new project](#using-it-in-a-new-project).

## What is in here

```
claude-code-conventions/
├── CLAUDE.md                 how to maintain this kit (not copied into projects)
├── README.md                 this file (not copied)
├── .claude/
│   ├── rules/                the conventions, one file per topic, loaded automatically by Claude Code
│   └── settings.json         sandbox + deny-list baseline
├── templates/
│   ├── CLAUDE.root.md        the project's root CLAUDE.md: placeholders, the options table, folder-guide links
│   ├── CLAUDE.backend.md     per-folder guide for a backend (one copy per backend)
│   ├── CLAUDE.app.md         per-folder guide for a client app
│   ├── CLAUDE.shared.md      per-folder guide for the shared contract package
│   └── README.md             the project's README.md: the flow, setup from a fresh clone, environments, commands
├── scripts/
│   ├── genIndex.ts           generates utils/INDEX.md + constants/INDEX.md ("does this exist already?")
│   └── hooks/pre-commit      refuses commits that add env files, private docs or listed leak words
├── .gitignore                env files, local Claude settings, the leak-words file, private docs
└── .yarnrc                   exact pins, no install scripts
```

## Using it in a new project

**Claude copying the kit: ask the owner every row of the options table below before writing the root guide.** One
question per option, with its values and what each one switches. Never fill a row from a guess, from the code or
from another project; a row with no answer stays `<…>` so the next session asks again.

1. Copy `.claude/`, `scripts/`, `.yarnrc` and `.gitignore` into the new repo root, `templates/CLAUDE.root.md`
   as the root `CLAUDE.md`, and `templates/README.md` as the root `README.md`.
2. Fill the `<placeholders>` in `CLAUDE.md` (product, stack, folder names, hard rules, glossary) and every row of
   its **Project options** table with the owner's answers. Rule sections that open with "Applies when **Option:
   value**" read that table. Fill `README.md` with the project's flow and setup steps.
3. Delete the rule files the options rule out (no backend: drop `50-backend.md` and
   `60-database-and-migrations.md`; no mobile app: drop or retoken `85-design-system.md`), and fix the `paths:`
   globs at the top of each remaining rule file so they match the real folder names (several backends: one
   glob line per backend folder). In `.claude/settings.json`, replace `<private-volume>` with a disk Claude must
   never touch, or delete those entries.
4. Copy the relevant `templates/CLAUDE.*.md` into each top-level folder as `CLAUDE.md` and fill them in (several
   backends: one `CLAUDE.backend.md` per backend, and the backends table in the root guide).
5. Wire `scripts/genIndex.ts` as `yarn gen:index` in the backend (several backends: in each one, passing its own
   `src` folder), and run `git config core.hooksPath scripts/hooks`.
6. Where the repo lives follows the **Repository** answer. On GitHub: the owner creates a private repository and
   adds it as `origin`. Local only: `git init` and nothing more; no remote, and no `.github/` folder.

The global rules (never increase spend, devops read-only, verification must be able to
fail, additive migration, never leak secrets, strict environment separation, task-completion tree output) live
in `~/.claude/CLAUDE.md` and apply everywhere; they are referenced here, not repeated. Production databases are
stricter in the kit itself: Claude never reads them either (`95-security-and-privacy.md`).

## Project options

The root guide's **Project options** table is the one place a project says what shape it has. Each row switches
the sections listed.

| Option | Values | Switches |
| --- | --- | --- |
| Languages | `en` or `en, <lang>` | `90-copy-and-i18n.md` section 3 (translation machinery) applies only with more than one language |
| Frontend apps | `none`, `one`, `several` | `80-frontend.md`: shared client package and the "used by two apps" promotion rule exist only with several apps |
| Backends | `none`, `one`, `several` | none: `50-backend.md`, `60-database-and-migrations.md` and `templates/CLAUDE.backend.md` do not apply; several: one folder and guide per backend, the shared server package and "Several backends" in `10-repo-structure.md` |
| Shared packages | `models + sdk + client`, `models only`, `none` | which layers of `10-repo-structure.md` and `70-shared-contract.md` exist |
| Clients can be out of date | `yes`, `no` | `70-shared-contract.md`: frozen contracts and `@deprecated` shims, or rename and remove outright |
| Database reached by | `server only`, `clients directly` | `60-database-and-migrations.md`: row-level security on every user-data table |
| Money | `yes`, `no` | the ledger, idempotency and payments sections of `50-backend.md`, `60-database-and-migrations.md`, `95-security-and-privacy.md` |
| Client platform | `React Native (Expo)`, `web`, `both` | navigation, storage and design-system notes in `80-frontend.md` and `85-design-system.md` |
| Build pace | `step by step`, `all at once` | `00-working-with-claude.md` "Build in steps": both wait for the plan OK; then stop for review after every step, or build in flow order and stop only at security boundaries |
| Repository | `on GitHub`, `local only` | `10-repo-structure.md` "Where the repository lives": a private GitHub `origin` with CI, or no remote ever and nothing from the repo pasted online; also the diff baseline in `00-working-with-claude.md` and the CI-actions rule in `95-security-and-privacy.md` |

## Rule files

| File | Covers |
| --- | --- |
| `00-working-with-claude.md` | how to respond, when to ask, build order and pace, working tree and branches, parallel sessions, verification, dependencies |
| `10-repo-structure.md` | monorepo layout, workspaces, one install, pinning, shared package, several backends (boundaries, the shared server package, grouped surfaces), standalone exceptions, where the repository lives (GitHub or local only), what the README holds |
| `20-files-and-naming.md` | folders by purpose, one concept per file, file and function naming, verbs, suffixes, exports |
| `30-code-structure.md` | inline first, one canonical definition, check before build, INDEX.md, constants, env, docblocks |
| `40-syntax.md` | TypeScript strictness, Zod schema and enum shapes, imports, `satisfies` |
| `50-backend.md` | three-layer endpoint, routes, controllers, validation, errors, status codes, concurrency, hydrators, workers |
| `60-database-and-migrations.md` | schema diagram, schema naming, migrations, raw SQL, transactions, indexes, letting the DB decide |
| `70-shared-contract.md` | DTOs, endpoint schemas, SDK, versioning and backward compatibility |
| `80-frontend.md` | components, API calls, loading and busy states, confirmations, contexts, hooks, analytics |
| `85-design-system.md` | tokens, shadows not borders, colour roles, type, radius, spacing, safe areas, buttons, checklist |
| `90-copy-and-i18n.md` | copy rules for every project (no dashes, canonical names, one word per concept); translation machinery only when the root guide declares more than one language |
| `95-security-and-privacy.md` | production databases out of reach, secrets, env files, dependencies, outbound calls, logging, payments |
