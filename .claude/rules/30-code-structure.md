# Code structure and hygiene

## Engineering principles

- **Industry standard always.** Auth flows, devops patterns, UX: default to what the industry has established, not
  something custom. If a well-known pattern exists for a problem, use it.
- **One canonical definition, used everywhere.** Every type, schema, enum, constant and formula has exactly one
  source of truth. Export it from the right shared place and import it; never redefine it locally, even "just for
  now". If an existing definition almost fits, extend or generalise it rather than creating a parallel version.
- **No hardcoded derived values.** Never hardcode a value owned by another component or system (a button's pixel
  height, a limit in `constants/`, a component's size). Import it, measure it (`onLayout`), or let the layout
  auto-size. Copies drift silently when the source changes.
- **Inline single-use logic; extract on reuse.** Don't create a standalone helper/util/file for logic with exactly
  one caller and no concrete, imminent second one. Keep it in the caller until a second call site appears, then
  extract. A one-call-site util buys no reuse; it adds a file and an import hop. Count real call sites; "might
  need it someday" does not count. Exceptions, all still fine: the cross-package **contract** (schemas, DTOs,
  endpoint schemas, SDK functions, shared components) always lives in the shared package even with one consumer;
  extraction that materially untangles a large function; logic that must be unit-tested in isolation; a self-
  contained concept clearly about to grow. Judgement over dogma, default to inlining.
- **Prefer simple, standard solutions over clever or abstract ones.** No premature abstractions, no custom
  frameworks, no "one component for everything", no deeply nested config-driven builders. Abstract repeated
  structure; never abstract away meaning.
- **Each derived state has one home.** A status, a display state, a predicate over stored fields (is this item
  visible? is this card failed?) is computed in exactly one function and imported everywhere; never re-inline the
  literal into a query or a condition. The only sanctioned raw literals are state-transition **writes**.
- **One writer per column family.** The columns of a state machine (status, attempts, nextRetryAt, …) are written
  only by the named transition helpers in one file; never updated inline.
- **A figure said twice comes from one builder**, so the two can't disagree.

## Check before you build

Before writing any utility, Zod schema, type, component, hook, constant, Prisma select or middleware, **search**:

| You need                          | Check first                                                               |
| --------------------------------- | ------------------------------------------------------------------------- |
| a Zod schema or enum              | `<shared>/models/src/core/`                                               |
| a shared TypeScript type / DTO    | `<shared>/models/src/dtos/` and existing endpoint schemas                 |
| a backend utility or constant     | the generated `<backend>/src/utils/INDEX.md` and `src/constants/INDEX.md` |
| a reusable Prisma select          | `<backend>/src/prisma/selects/`                                           |
| code another backend already has  | `<shared>/server/` (**Backends: several**, see `10-repo-structure.md`)    |
| a UI component, hook, client util | `<shared>/client/components/`, `hooks/`, `utils/`                         |
| an API call pattern               | `<shared>/client/api/` (`callAuthed` / `callPublic`)                      |

**`INDEX.md` files are generated manifests** (`yarn gen:index`, `scripts/genIndex.ts`): every util and constant
with its exports and one-line purpose taken from its docblock. Read the relevant one before adding anything;
regenerate after adding, removing or renaming a util or constant. Never edit them by hand.

## Constants

- **Never hardcode a config value in a controller, utility, adapter or component.** Import it from
  `constants/<domain>/UPPER_SNAKE.ts` (server) or the shared package's `constants/` (both sides).
- One exported object per domain concept (`OTP`, `JWT`, `LOGIN`), UPPER_SNAKE keys; merge same-purpose values
  into one file rather than scattering one-liners. Add a domain folder if none fits; never recreate a `tunables/`
  or `misc/` bucket.
- Time values carry their unit as a suffix and a comment: `HASH_ROUNDS: 12`, `EXPIRATION_MS: 15 * 60 * 1000, // 15 minutes`.
- A constant that re-prices or re-derives historical data when it changes (a pricing algorithm, a multiplier)
  moves only together with a version bump that is stamped on every row it produces.
- **A user's own settings are data in the database, not constants.** Keep the code generic.

```ts
// src/constants/auth/OTP.ts
/** One-time codes: hashing cost, attempt cap and lifetime. */
export const OTP = {
  HASH_ROUNDS: 12,
  MAX_ATTEMPTS: 5,
  EXPIRATION_MS: 15 * 60 * 1000, // 15 minutes
};
```

## Environment variables

- **All env variables are declared and validated in one file** (`src/environment/envVariables.ts`, strict Zod
  schema: a missing, unknown or invalid variable stops the process; messages name variables, never values).
  Everything else imports `envVariables`. **Never read `process.env` anywhere else.** With **Backends: several**
  that is one file per backend (`10-repo-structure.md`, "Several backends").
- A new variable: a line in the schema, a line in `.env.example`, the real value given to the owner to add.
- Per environment, always (global rule: strict environment separation).

## Docblocks and comments

- **Every controller, screen, component, hook, utility and constant file starts with a docblock** saying what it is
  for and anything non-obvious (its flow, the invariants it relies on, why a choice was made and the decision's
  date or incident id). The first sentence is what `INDEX.md` lists. A controller's first line is
  `` `METHOD /path` — what it does ``.
- **Update the docblock whenever you change behaviour.** A stale docblock is worse than none, because it is
  believed. When a function is split, moved or renamed, its docblock moves with it and is reread.
- **Inline comments** for what the names can't say: complex queries with several conditions, business logic not
  obvious from variable names, race-condition handling and atomic operations, why a specific error code, an order
  of operations that matters, anything done for a recorded case (by its id).
- A docblock never holds: a figure from real user data, a line-by-line restatement of the code, a promise about
  future behaviour (the plan lives in `docs/`), a line number (name the module and function instead).
- `@deprecated` JSDoc on anything kept only for back-compat, with the reason, the constant default and the removal
  trigger, so the whole back-compat surface is one `grep`.

## Before saying a task is done

- Typecheck and lint pass in every touched workspace; tests pass; `yarn gen:index` was run if a util or constant
  was added, removed or renamed.
- A pure helper got a check with invented values, and a deliberate mutation of the rule made it fail (then the
  file was restored and compared byte for byte).
- The relevant `CLAUDE.md` reflects any new util, pattern or gotcha.
- The `README.md` setup still works from a fresh clone (see `10-repo-structure.md`).
- The file-change tree summary (global rule) ends the reply.
