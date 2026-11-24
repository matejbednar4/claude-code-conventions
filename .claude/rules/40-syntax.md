# Code syntax

## TypeScript

- **TypeScript strict everywhere.** No `any` without a comment saying why (an untyped SDK confined to one wrapper
  file is the usual legitimate case). `useNavigation()` typed as `any` is tolerated in the apps.
- **Type every response with `satisfies`:** `res.status(200).json({ message, data } satisfies MyResponse)`. Never
  cast a response.
- Access validated request data through the typed slot (`req.validatedBody as CreateBody`), never raw `req.body`.
- Prefer string unions and Zod enums over TypeScript `enum`. When the runtime strips types (Node 22 running `.ts`
  directly), use only erasable syntax: no `enum`, no `namespace`, no constructor parameter properties, and set
  `erasableSyntaxOnly: true` in `tsconfig`.
- Relative imports carry their extension where the runtime needs it (`.js` for compiled ESM, `.ts` for type-
  stripped Node); a post-build fixer (`yarn fix:imports`) is acceptable, hand-editing emitted paths is not.
- Path alias `@/*` → the app root (or `./src/*`), declared in `tsconfig` and the bundler together.

## Zod

- Schemas and their types are two exports, named as a pair: `XSchema` and `type X = z.infer<typeof XSchema>`. The
  type never ends in `Schema`.
- Endpoint schemas: `<Endpoint>BodySchema`, `<Endpoint>QuerySchema`, `<Endpoint>ParamsSchema`,
  `<Endpoint>ResponseSchema`, each with its `z.infer` type.
- **Request and response schemas are separate.** A request schema holds only what the client can send; a schema
  that requires a server-only field can never be satisfied and loops validation failures forever.
- Query and URL parameters arrive as text: `z.coerce.number()` for numbers, with bounds (`.gte(-90).lte(90)`).
- A schema may clean input (`trim`, empty → `null`); the server stores `z.infer`, the client function takes
  `z.input<typeof XBodySchema>`.
- Enums are three exports: `const XValues = [...] as const`, `XSchema = z.enum(XValues)`, `type X`. Values are
  UPPER_SNAKE. A stored enum has a type-level check that its values match the database enum
  (`sharedEnumsMatchPrisma.ts` fails `tsc` when they differ).
- One shared `IdParamsSchema` / `UidParamsSchema` for every route with an id.

## Async and errors

- Controllers are wrapped in `asyncHandler` (or the framework's equivalent); never an unhandled promise.
- Throw `createCustomError(code, message, status)`; the options form `createCustomError(code, message, { status,
  permanent, expected, errors, cause, notify, notifyKey })` for workers and observability. Never `throw new Error`
  for anything that can reach a client.
- In a `catch` that wraps unknown errors, **rethrow our own errors untouched first**:
  `if (isCustomError(err)) throw err;`. Otherwise their code, message and alert flags are lost.
- Never swallow an error (`catch {}`), except best-effort cleanup that must not mask the original error
  (`.catch(() => {})` on a delete of temporary resources, inside a path that rethrows the original).
- Busy flags reset in `finally`.

## React

- Hooks before any early return (Rules of Hooks); in multi-language projects `useTranslation` first.
- Memoise a `StyleSheet` that reads theme colours (`useMemo(() => StyleSheet.create(...), [colors])`); never a
  static `StyleSheet` with theme values in scope.
- Multi-language projects: module-level constants can't call `t()`, so config that needs translation moves
  inside the component body; store translation **keys** in memos and call `t()` at render (see
  `90-copy-and-i18n.md`).
- `useCallback` for handlers passed to children; `useMemo` for expensive values; split large contexts.
- `FlatList` (or the shared paginated list) for long lists, never `ScrollView` + `map`.

## Python (when a project is Python)

PEP 8: snake_case modules/functions/variables, functions verb first; PascalCase classes; UPPER_SNAKE constants
marked `Final`; `_or_raise` suffix for raising functions; `None` for "no answer" with the return type saying so;
type hints on everything with mypy strict; pydantic strict models with `extra="forbid"` for everything that comes
in; empty `__init__.py` (no re-exports, no `import *`); secrets as `SecretStr`; `Decimal` at the edge for money
sent out, `float` for maths ported from JavaScript.
