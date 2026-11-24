# Working with Claude in this repo

Applies in every folder of the project.

## Before you implement anything

Four rules that apply to every task, no exceptions.

1. **Ask when not 100% sure of the requirement.** If anything is ambiguous (scope, intended behaviour, which
   files to touch, whether a migration is needed, what the output should look like) stop and ask before writing
   code. One focused question ("Did you mean X or Y?") costs nothing; building the wrong thing costs hours. Non-
   negotiable for: database schema changes and migrations; breaking changes to the API contract; financial logic
   (ledger, balances, payments, anything that places an order); changes that affect multiple apps or backends at once; anything
   under a project's safety or privacy rules. For routine code with an obvious answer, decide and **say what you
   decided** in the reply.
2. **Check for existing implementations before building new ones.** Search the codebase first (the generated
   `INDEX.md` manifests, the shared package, `components/`, `hooks/`). One canonical definition, used everywhere.
   See `30-code-structure.md`.
3. **Update the relevant `CLAUDE.md` and `README.md` in the same pass** when you add a utility, a pattern, a
   setup step or an env variable, or discover a gotcha. An outdated guide is worse than no guide (README
   contents: `10-repo-structure.md`).
4. **Build in the order the system flows.** Plan the steps from the foundation up, the way an experienced
   developer would, and build them in that order; never build one part, then another, and glue them together at
   the end. Whether you stop for review after each step is the root guide's **Build pace** option. See "Build in
   steps" below.

Diffing or auditing a branch? Baseline against `origin/main` (run `git fetch` first), not the stale local `main`.
In a local-only repo (**Repository: local only**, `10-repo-structure.md`) there is no remote: the local `main` is
the baseline.

## Build in steps, in the order the work flows

The owner has to understand what is being built. The order below applies in every project; how often to stop is the
**Build pace** option in the root guide.

### Every project

- **Plan first, and wait for an OK on the plan.** Before any code on a task that spans more than one layer,
  write the step plan: the steps in flow order, one line each saying what it builds and what the owner can check
  once it is done. Start building only after the owner approves it.
- **Foundation first, then whatever depends on it.** Typical orders:
  - full-stack feature: network (VPC, subnets, security groups) → database schema → endpoint plumbing
    (contract, routes with validation, SDK) → controllers → frontend
  - **The endpoint plumbing is one step; the controller is its own step.** The contract, the route line and the
    SDK function are standard wiring that mirror each other, so they are built and reviewed together. The
    controller holds the logic, so it is built and reviewed on its own.
  - processing pipeline: install the tools and models → isolate the network (tunnel, firewall) → input →
    processing → output
  - a change across two backends (**Backends: several**): the contract → the backend that serves it → the
    backend that calls it
- **A security boundary is a stop at any pace** (network, firewall, tunnel, auth, secrets, access rules). Show
  the whole configuration: every open port, rule, route and allowed host. Say in plain words what can reach
  what. Give the command that proves the closed paths are actually closed. Nothing goes on top of a boundary
  the owner has not reviewed.
- **A schema step ends with a diagram** (see `60-database-and-migrations.md`).
- **Verify each step before building the next one on it**, with a check that can fail, so a fault is caught in
  the layer that has it.
- **"In one change" elsewhere in these rules means one PR, not one step.** The layers of an endpoint still ship
  together (`50-backend.md`), but inside that PR they are built as two steps: the plumbing, then the controller.
- A change that touches only one layer is a single step.

### Step by step

Applies when **Build pace: step by step**.

- **One step per turn, then stop.** Report what was built, where it sits in the flow, what to look at, and what
  the next step is. Start the next step only when the owner says so.
- **Keep each step small enough to review in one sitting.** If a step's diff is too big to read, split it.
- If the owner says "do it all at once" for a task, that applies to that task only.

### All at once

Applies when **Build pace: all at once**.

- Once the owner approves the plan, build every step in order without stopping, except at a security boundary.
- The report walks through the steps in flow order: what each one built and what to look at.
- If the owner asks for step by step on a task, that applies to that task only.

## Work in the owner's working tree, on their current branch

All work happens directly in the checked-out working tree, on the branch that is checked out, so changes show up
in the IDE and dev builds immediately.

- **No worktrees, no clones, no isolated copies for the deliverable** unless the owner explicitly asks in the current
  conversation. Scratch space (the session scratchpad, temp dirs) is fine for throwaway experiments, repro
  scripts and verification; every code change that is part of the result lands in this tree.
- **Don't switch branches or create new ones on your own.**
- **Never work on `main`.** If `main` is checked out, stop and ask which branch to use.
- **Leave changes uncommitted.** No `git commit`, `git push`, no PRs unless explicitly asked. The deliverable is
  the edited working tree.
- **Parallel sessions share this tree.** Re-read files right before editing, touch only the files your task
  needs, and merge around other sessions' uncommitted changes. Never revert or overwrite work you didn't do.

## How to respond

- **After finishing any task, write a file change summary in tree format** (the global rule): grouped by top-
  level directory, nested paths, each file labelled `added` / `changed` / `removed` with one sentence.
- **Report what was built against what was asked:** what changed, anything removed with it, the decisions the owner
  should check, and what no check could see (the browser, real data) with the one or two things to look at.
- **Any "it works" claim needs a check that could actually fail.** Say what a failure would have looked like.
  Verify content, not reachability (global rule).
- **Plain language.** Spell out domain terms (finance, medical, legal); no unexplained jargon or abbreviations.
  Explain major decisions briefly; don't lecture.
- **Talk to the owner as a peer in the domain**, not as a student: when a decision touches how a practitioner thinks
  (an accountant, a doctor, a lawyer), say what a seasoned one would think and why, briefly, in the reply.
  Anything lasting goes into the relevant `docs/` file as reference, not as a lesson.
- A **"design only"** change touches no logic: before finishing, list the diff's lines that touch loads, maths or
  state; the only acceptable ones are display.

## Who runs what

Split the work by what touches real systems:

- **Claude does on its own:** repo and project setup, folder structure, config files, application code, checks,
  routine shell commands, typecheck/lint/tests that open no real database and call nothing out.
- **Claude builds and explains:** security code inside the app (anything handling a key, token, session,
  signature; guards that refuse or stop an action; the env loader's checks).
- **The owner runs, Claude gives the exact commands:** anything on the machine itself or touching real data or real
  money: credentials, env files, creating or migrating a real database, running against production, the git
  remote, Claude Code's own settings. Explain the concept, give the exact commands or file contents and what each
  part does.

## Dependencies

- **yarn, never npm.** `npm` writes a `package-lock.json` and diverges from the pinned `yarn.lock`.
- **A new dependency ALWAYS needs the owner's OK first, and ALWAYS gets an internet check before it is proposed.**
  For the exact version to be installed, search the web for known bugs, open issues, security advisories (npm
  audit / GitHub advisories / Snyk), breaking changes, and signs of a compromised release or maintainer change.
  Report what was found (or that nothing was found, and where you looked) together with publisher, download
  counts, last update and typosquatting check; then wait for the OK. Prefer the standard library, then the
  framework's own modules, then a well-known package. Afterwards, list what it pulled in. This applies to every
  project, however small, and to upgrades as well as additions.
- Versions are pinned exactly (`.yarnrc`: `save-prefix ""`); shared versions (React, Zod, TypeScript) are pinned
  once at the root under `resolutions`. No `*` versions in app or backend `package.json`.

## Shell hygiene

- **Never `cd` into another folder in a shell command; use absolute paths or `yarn --cwd <dir>`.** Claude Code
  creates an empty `.claude/` folder in every directory its shell moves into; inside `prisma/migrations/` that
  folder reads as an unapplied migration.
- Never print a secret's value; read it into a variable and show only its name or a redacted prefix.
- Temporary files go in `$TMPDIR` / the session scratchpad, never in the repo.

## Decisions and incidents carry their date

A decision in a guide carries its date (`2026-11-03`) so a later reader knows what it replaced. An incident that
produced a rule gets an id (`E012`) that code comments and guides can reference. Don't "fix" a recorded exception;
flag new borderline cases for a product call.
