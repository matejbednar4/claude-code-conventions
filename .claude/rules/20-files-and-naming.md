# Files, folders and names

## Folders: by purpose, never by kind

- **File a util by what it is for**, not by the kind of function it is: `utils/geocoding/`, `utils/pricing/`,
  `utils/auth/otp/`, `utils/money/<provider>/`. The verb prefix in the file name (`create*` / `validate*` /
  `hydrate*` / `send*`) already carries the kind. **No kind-based grab-bag folders** (`helpers/`, `validators/`,
  `writers/`, `senders/`, `formatters/`): they scatter one feature across many folders.
- The only kind-based folders are **layers**: `core/` (domain-agnostic primitives: errors, http, db, uids),
  `formatting/`, `hydrators/` (DB → DTO), `clients/` (third-party SDK singletons), `adapters/` (one folder per
  external system, the only code that knows its shapes); and on the client `app/`, `components/`, `hooks/`,
  `contexts/`, `providers/`.
- This matches every layer: `constants/<domain>/`, `controllers/<audience>/<domain>/`, `routes/<resource>/`.
- **A folder for one file is a folder too many.** Two levels under `src/` is the usual depth, three the most.
  Collapse micro-folders.
- **Code used by one feature stays inside it.** A screen's own pieces sit beside the screen; pure helpers that
  several pieces of one area share go in that area's folder. A piece moves up to a shared folder only when a
  second area needs it.

## One concept per file

- **One function per file for controllers and utilities**, named after its export: `createCustomError.ts` exports
  `createCustomError`; `ACCOUNTS.ts` exports `ACCOUNTS`; `Account.ts` exports `AccountSchema` and `Account`.
- **Small functions about the same thing that won't grow much share one file named after the thing** (`vault.ts`,
  `password.ts`, `databaseErrors.ts`). Exported functions first, private helpers after, unexported. Split when it
  grows past a screen or collects functions about different things.
- **Functions sharing in-memory state stay in one file, with the state private to it** (a session store, a login
  attempt counter, the Prisma client singleton).
- **A type travels with the function it belongs to** (`CustomError` in `createCustomError.ts`). A type that
  stands alone gets its own file under `types/`.
- **Tests sit next to what they test**: `__tests__/<Subject>.<case>.test.tsx` beside a screen or component in the
  apps; `<name>.test.ts` beside a pure function in a shared package.

## File names, by kind

| Kind | File | Example |
| --- | --- | --- |
| function, util, hook | camelCase, verb first | `geocodeAddressOrThrow.ts`, `useAccounts.ts` |
| React component | PascalCase, **in its own folder** with `index.tsx`, `styles.ts` when non-trivial, and colocated translations in multi-language projects | `components/cards/AccountCard/{index.tsx, styles.ts}` (+ `AccountCard.en.json`, `AccountCard.<lang>.json` when translated) |
| screen / route | the router's file convention (`app/(group)/segment/index.tsx`); translations beside it in multi-language projects | `app/(onboarding)/otp/index.tsx` (+ `otp.en.json`, `otp.<lang>.json` when translated) |
| constants | UPPER_SNAKE, one exported object named like the file | `constants/auth/OTP.ts` |
| schema and its type, standalone type | PascalCase noun | `dtos/AccountSummary.ts`, `types/PaymentAdapter.ts` |
| endpoint contract, SDK function, controller | camelCase verbNoun, **the same name in all three layers** | `getAccountsFromSearch` |
| route folder | the URL segment, kebab-case like the URL | `routes/setup-categories/`; controller/endpoint folders use the camelCase twin `setupCategories/` |
| worker | one folder per worker with `run.ts` + `helpers/` | `workers/settlePayments/run.ts` |

## Function names: the verb says what kind

Every function starts with a verb, and the verb means the same everywhere.

| Verb | Does |
| --- | --- |
| `get` | returns something at hand or cheap to read; a controller that answers a read |
| `find` | queries the database for rows that may not exist |
| `fetch` | calls out over the network |
| `create`, `update`, `delete`, `save` | writes: a new row, a change, a removal, an upsert of a whole thing |
| `record` | appends to a history that is never edited |
| `ensure` | gets, creating first when missing |
| `start`, `run` | begins a background job; runs a loop or job to its end |
| `hydrate` | turns stored rows into a contract shape (DTO) |
| `calculate` | numbers |
| `build` | assembles a structure, list or text from parts |
| `derive` | works a status or display state out of stored fields; each derived state has **one home** |
| `link`, `match` | pairs things up |
| `format` | a value into text for the screen |
| `parse` | text into a value |
| `sort`, `group`, `filter` | reorders, groups, narrows; `compareX` is a sort's comparator |
| `read` | reads a file or the settings |
| `is`, `has`, `can`, `should` | returns a boolean |
| `assert`, `validate` | checks and throws on failure (with `OrThrow`) |
| `queue`, `send` | enqueues a job; sends a message/email/push |

- **How a function fails is in its name:** `…OrThrow` throws; `…OrReturn` hands the failure back; `…OrExit` stops
  the process. A function that may have no answer returns `null` and says so in its type, with no suffix.
- **Units are in the name** when a number has one: `windowMs`, `lagMs`, `priceCents`, `feePercent`,
  `multiplierBps`. A time constant carries its unit and a comment: `EXPIRATION_MS: 15 * 60 * 1000, // 15 minutes`.
- **Booleans read as a yes/no question:** `isOpen`, `hasStop`, `canSync`. In React state a running activity is an
  `-ing` word (`loading`, `submitting`), something shown or not is `xOpen` (`drawerOpen`), a finished fact a past
  participle (`hydrated`).
- **Callback props are `onX`** (`onPress`, `onAssessed`); a component's own handlers are `handleX` or a plain
  verb, consistently within a file.
- **Components are PascalCase nouns ending in their role:** `…Card`, `…List`, `…Row`, `…Sheet`, `…Strip`, `…Bar`,
  `…Chart`, `…Tag`, `…Dialog`, `…Section`, `…Notice`. Props type is `<Name>Props`, declared above the component.
- **Hooks are `useX`**, one per file: a data hook named after what it loads (`useAccounts`), a behaviour hook after
  what it does (`useBlockBackWhile`).
- **Contexts:** `contexts/<Name>Context.tsx` with `<Name>Provider` and a `use<Name>()` accessor that throws outside
  the provider.

## Exports and imports

- **Named exports by default.** Default exports only where the framework requires them (file-based router
  screens, a config file).
- **A shared package exposes one public barrel** (`index.ts`); consumers import by symbol from the package and
  never deep-import into it. **Inside a package or app, import the exact file**; don't add barrels that only
  re-export (they hide the file a symbol lives in and widen bundles).
- The models package has **version-namespaced entry points** (`@<brand>/models/v2/<group>`,
  `@<brand>/models/shared`) so schema names stay clean (`SubmitFeedbackBodySchema`, no `V2` suffix: the version
  lives in the path).
- Import extensions follow the build: a compiled ESM backend imports with `.js`; a type-stripped Node runtime
  imports with `.ts`. Pick one per package and keep it.
