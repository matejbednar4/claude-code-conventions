# CLAUDE.md

This repository is a **conventions kit**: the code and Claude Code conventions the owner copies into every new
project. It is not a product and has no runtime. The rule files in `.claude/rules/` are loaded here too, so
Claude sees exactly what a consuming project would see. The rules below are about maintaining the kit itself
and apply only in this repository.

## What is copied and what is not

| Path | Copied into a project? | Role |
| --- | --- | --- |
| `.claude/rules/*.md` | yes, verbatim | the conventions, one file per topic |
| `.claude/settings.json` | yes | sandbox and deny-list baseline |
| `templates/CLAUDE.root.md` | yes, as the project's root `CLAUDE.md` | the project guide: placeholders, the options table, folder-guide links |
| `templates/CLAUDE.{backend,app,shared}.md` | yes, as `<folder>/CLAUDE.md` | per-folder guides |
| `templates/README.md` | yes, as the project's root `README.md` | the flow, setup from a fresh clone, environments, commands |
| `scripts/`, `.yarnrc`, `.gitignore` | yes | index generator, pre-commit hook, yarn and ignore settings |
| `CLAUDE.md` (this file), `README.md` | **no** | how to maintain the kit; how to use it |

## Hard rules for this repository

1. **Never cite a source.** A rule is stated as a rule, not attributed. No `Source:` lines, no "taken from", no
   "as in <repo>", no name of any product, repository, company, client or person (the owner included: the
   rules say "the owner"), no incident id from another repository, no path from a real machine. When a rule
   arrives from a product repo, distill it and drop where it came from. Dated decisions (`decision 2026-11-08`)
   stay: the date is about the rule, not its origin.
2. **Everything project-specific is a placeholder.** Folder names, package scopes, audiences, groups, domains,
   languages and versions are written in angle brackets from the glossary below, never as a real project's
   values. A rule that needs a concrete example uses an invented, domain-neutral name (`Account`, `Item`,
   `Order`, `getAccountsFromSearch`, `utils/pricing/`), never a real feature. Real values live only in the
   consuming project's root `CLAUDE.md`.
3. **Everything that varies between projects is an option, never a fork.** A rule that applies only to some
   projects opens with one line, `Applies when **<Option>: <value>**`, and reads the answer from the **Project
   options** table in `templates/CLAUDE.root.md`. Adding a branch means adding or extending an option in that
   table and in the README's options table in the same change. Never create a second variant of a rule file.
   Claude asks the owner every option when the kit is copied (README, "Using it in a new project"), so an option
   is a short closed list of values that can be asked as one question.
4. **One home per rule.** A rule lives in exactly one file, by topic; other files point to it by file name
   (`see 40-syntax.md`) instead of repeating it. The global hard rules in `~/.claude/CLAUDE.md` are referenced,
   never copied in.
5. **The kit stays copyable as-is.** No `package.json`, no `node_modules/`, no build step, nothing that must be
   edited before the copy works except the placeholders. The `paths:` globs at the top of a rule file use the
   same placeholders as the text.
6. **Voice.** Rules are written for Claude Code reading them inside a project: imperative, one idea per bullet,
   with the reason when it is not obvious. No em dashes or en dashes in rule text (the same rule the kit gives
   user-facing copy); a colon, a comma or parentheses instead.

## Placeholder glossary

| Placeholder | Means |
| --- | --- |
| `<backend>` | a backend workspace folder (one per backend) |
| `<app>` | a client app workspace folder (one per app) |
| `<surface>` | a folder grouping one backend and the one app it serves (`<surface>/server/`, `<surface>/client/`) |
| `<shared>` | the shared packages folder (`models/`, `sdk/`, `client/`, and `server/` with several backends) |
| `@<brand>` | the npm scope of the workspace packages |
| `<audience>` | a principal type the API serves (one per app, and one per calling backend), plus `public` |
| `<group>` | an entry-point group of the models and SDK packages: one per audience plus a cross-app one |
| `<domain>` | a business area used to group constants, controllers and utils |
| `<version>` | a wire-contract version (`v1`, `v2`) |
| `<lang>` | an additional language code of a multi-language project |
| `<Name>`, `<Endpoint>`, `<verbNoun>` | a component, an endpoint contract, a controller or SDK function |
| `<prefix>`, `<schema>`, `<table>`, `<provider>` | a uid prefix, a database schema or table, a third-party service |
| `<private-volume>` | a disk Claude must never read or write (`.claude/settings.json`) |
| the owner | the person whose project it is: Claude asks them, they approve, they run what touches real systems |

## Adding or changing a rule

1. Find the one file the topic belongs to (README table) and put the rule where a reader would look for it,
   next to related rules; never append at the end.
2. Strip origin, names and real values (rules 1 and 2). If it applies only to some projects, add the
   "Applies when" line (rule 3).
3. Update the README's rule table when a file's coverage changes, and its options table when an option changes.
4. Update the templates when a rule needs something from a project guide (a new option row, a new section).

## Before saying a task is done

- The origin sweep prints nothing. A hit is a failure:

  ```bash
  grep -rn -E "^[S]ource:|[T]aken from|\((source) of truth\)|\(E[0-9]{3}\)" .claude templates scripts README.md CLAUDE.md
  ```

- No rule file names a real product, repository or feature (rule 2 is judgement; read the diff for it).
- The README's two tables match the rule files and the options table in `templates/CLAUDE.root.md`.
- The pre-commit hook is installed (`git config core.hooksPath scripts/hooks`) and the gitignored
  `scripts/hooks/leak-words.local` lists the names of the source repositories, so a commit that re-introduces
  one is refused before it lands.
