# Repo structure

Which layers exist follows the root guide's **Project options** (**Backends**, **Frontend apps**, **Shared
packages**). A single app with no backend is just `<app>/` plus `docs/` and `scripts/`; the rules about one
install, pinning, namespaced packages and committed guides apply regardless.

## One repo, yarn workspaces, one install

- A product is one monorepo: every backend, each client app, and the shared packages. **One `yarn.lock` and one
  `node_modules/` at the root**; always `yarn install` from the root, never inside a workspace. If builds fail with
  version conflicts, look for a stray nested `node_modules/`, delete it, reinstall.
- **Standalone exceptions are explicit.** A deployable that must not couple its build to the monorepo (a marketing
  site, a landing page) is a standalone project with its own `node_modules/` and `yarn.lock`, documented as such in
  the root `CLAUDE.md`, and excluded from the root `clean:install`.
- Shared dependencies (React, Zod, TypeScript, React Native) are pinned once in the root `package.json` under
  `resolutions`. App and backend `package.json` never use `*`; a shared client package may, since it inherits the
  app's versions.
- Workspace package names are namespaced (`@<brand>/models`), never bare generic names (`server`, `client`): yarn 1
  can silently fetch a same-named public package instead (dependency confusion).

## The layers

```
<repo>/
├── <backend>/             API server + workers (one flat tree behind a versioned wire contract);
│                          one folder per backend with Backends: several
├── <app-a>/ <app-b>/      client apps, one folder each
├── <shared>/
│   ├── models/            the API contract: Zod DTOs, endpoint schemas, enums, constants, catalogs
│   ├── sdk/               typed client functions, one per endpoint, over one request wrapper
│   ├── client/            design system (tokens, components) + cross-app client utilities
│   └── server/            code two or more backends run (Backends: several only)
├── docs/                  deep-dives the folder guides link to (lifecycles, devops, notifications, …)
├── scripts/               repo-level scripts and git hooks
└── .github/workflows/     CI/CD (Repository: on GitHub only)
```

- **The shared contract is a package other workspaces import by name** (`@<brand>/models`), with explicit entry
  points in its `package.json` `exports` map so consumers bundle only what they use. Build order: models first,
  then the shared server package if there is one, then backends and apps. After editing the models package,
  rebuild it (`yarn build`) before a backend typecheck reflects the change; restart apps using it.
- **Backend never imports client packages** (the SDK or the design system); clients never import backend code.
  The backend defines the API the SDK consumes. The one exception, a backend calling another backend, is under
  "Several backends" below.
- **Only the wire contract is versioned** (`controllers/v2`, `routes/v2`, models `endpoints/v2`, `dtos/v2`).
  Everything behind it (`utils/`, `constants/`, `middleware/`, `workers/`, models `core/`) is one flat tree
  organised by domain. A new client generation adds `v3` trees alongside; a retired one is deleted wholesale.
  External-caller endpoints (webhooks from a payment or other third-party provider, email unsubscribe) are never client-versioned: their URLs
  are frozen because the external dashboards point at them.

## Several backends

Applies when **Backends: several**. A product has several backends when its server-side jobs must not share a
process: they hold different credentials, serve different audiences, run on different hosts, or must restart and
fail alone. A second worker of one backend is not a second backend.

- **One folder per backend, each a full backend on its own.** Every rule in `50-backend.md` and
  `60-database-and-migrations.md` applies inside each one: its own `src/` tree, `package.json`, folder guide,
  tests and generated `INDEX.md` files.
- **Its own settings and secrets.** Each backend has its own `environment/envVariables.ts` and its own env file,
  listing only what its job needs. No backend reads another's env file, and none holds a credential it does not
  use. The code that loads and checks variables may be shared; the list of variables never is.
- **A database has one owner.** Its schema, migrations and database client live in exactly one backend. Another
  backend that needs the data asks the owner through the contract; it never opens the same database.
- **No backend imports another backend's code.** They talk only through the contract in `<shared>/models`: the
  backend being called serves a `<group>` of endpoints, and the caller is one more `<audience>` of it
  (`70-shared-contract.md`, `50-backend.md` "Validation and access"). The caller may import the SDK for that
  group and no other; this is the one case where a backend imports the SDK.
- **Every pair that talks is listed.** The root guide's backends table names each backend, what it serves, what
  it holds and which backends may call it. A pair not in the table does not talk. Adding one needs the owner's
  OK and is a security boundary (`00-working-with-claude.md`).
- **`<shared>/server/` holds what two or more backends run** (the env loader, health reporting, the worker
  runtime, an outbound client). It is Node only: no client app and neither `models/` nor `sdk/` imports it, and
  it imports no backend. Code moves there when a second backend needs it, never ahead of that; until then it
  stays in the backend that uses it. It declares no env variables and holds no secrets: each backend passes in
  what it validated.
- **A backend and the one app it serves may share a folder:** `<surface>/server/` and `<surface>/client/`, so
  the two are read, reviewed and deployed together. In these rules `<backend>` and `<app>` then stand for those
  two folders. Each stays its own workspace (`@<brand>/<surface>-server`, `@<brand>/<surface>-client`) with its
  own `CLAUDE.md`; grouping changes the path, never the import rules.
- **A backend in another language** is a standalone exception (see "One repo" above): outside the workspaces,
  with its own lockfile, bound by the same boundaries and listed in the same table.

## Where the repository lives

The root guide's **Repository** option says where the code is kept. At either value, the owner sets up any
remote. Claude never adds, changes or removes one, never pushes unless asked, and never suggests moving a repo
to another host or making it public.

### On GitHub

Applies when **Repository: on GitHub**.

- One remote, `origin`, on GitHub, private unless the owner says otherwise.
- CI and deploys run from `.github/workflows/`; CI secrets live in the GitHub Actions secret store; third-party
  actions follow `95-security-and-privacy.md`.

### Local only

Applies when **Repository: local only**. The code stays on the owner's machine; that is the point of the option.

- **No remote, ever.** The repo's code never reaches GitHub or any other hosting service.
- **Nothing from the repo goes into a web form:** no code, diff, file content or error output pasted into an
  issue, gist, pastebin, PR, forum or online tool.
- **No GitHub tooling for this repo:** no `gh`, no GitHub connector calls about it, no `.github/` folder.
- **Checks run locally:** typecheck, lint, tests and the pre-commit hook. A deploy, if there is one, is a script
  in `scripts/` that the owner runs, documented in the README.
- **Backups are the owner's**, on storage they control (an encrypted disk). Claude never sets one up and never
  suggests a hosted service for it.

## Docs

- Each top-level folder (every backend, every app, the shared folder) has a `CLAUDE.md` Claude Code loads
  automatically when working there. The root `CLAUDE.md` lists them. A rule that governs **all** UI (the design system) is `@imported` into the root file so
  it is always in context.
- `docs/` holds the deep-dives the guides link to; a guide keeps the day-to-day rulebook and links out for the
  full mechanics. Deep folder-level `CLAUDE.md` files are fine for a sharp-edged area (hydrators, money code).
- Every `CLAUDE.md` is committed. (A repo shared read-only with outsiders may gitignore its guides; that is the
  exception, not the rule, and it is recorded in the root guide.)

### README.md

`README.md` is for running the project; `CLAUDE.md` is for how to work in it. It starts from
`templates/README.md` and always has these sections, in this order:

1. **What this is and the flow:** two or three sentences, then the usual path through the system as a short
   numbered list or diagram (request → route → controller → database; input → processing → output).
2. **Setup, step by step from a fresh clone:** prerequisites with exact versions, install, the env file (copy
   `.env.example`, list each variable's name and where its value comes from, never the value), database, first
   run. Every command can be copied and pasted, in order, with nothing assumed.
3. **Environments**, when there are several: what each one is for, how to point a local run at each (never at
   production: `95-security-and-privacy.md`), and how a change reaches each one.
4. **Day-to-day commands:** dev, test, typecheck, lint, build.

- **Update it in the same change as anything that affects it:** a new env variable, prerequisite or service, a
  changed command, a new step in the flow, a new environment. A README that no longer works from a fresh clone
  is a bug.
- **Never in the README:** secret values, private hostnames or account ids, personal data, production data.
  Name each secret and say where it lives instead.
- **To check it**, walk the setup section against the repo: every command exists in a `package.json`, and every
  variable is in `.env.example` and the env schema.
