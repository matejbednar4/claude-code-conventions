---
paths:
  - "<shared>/**"
  - "**/models/**"
  - "**/sdk/**"
---

# The shared contract: DTOs, endpoint schemas, SDK, versioning

Applies when **Shared packages** is not `none` in the root guide; the SDK rules when it includes `sdk`.

## What lives in the shared package

- **The models package is the single source of truth for the API contract:** Zod schemas, DTOs, endpoint
  request/response types, core enums, uid schemas, shared constants (error codes) and catalogs. Consumed by every
  app and every backend.
- **Code here runs in Node and in the browser/native:** no `node:` imports, no ORM, no React, no I/O. Its only
  runtime dependency is `zod`, pinned to the same version on both sides.
- **Entry points, not deep imports:** `@<brand>/models/shared` (version-agnostic: `core/`, `catalogs/`,
  `constants/` only), `@<brand>/models/v2/<group>` (one group per audience plus a cross-app one). Each is an
  `index.v2.<group>.ts` barrel plus an `exports` map entry. A new entry point needs a build before consumers
  resolve it.
- With **Backends: several**, each `<group>` is served by exactly one backend, and a backend that calls another
  is an audience with its own group and entry point, so every consumer bundles only the contract it uses
  (`10-repo-structure.md`, "Several backends").
- Pure logic both sides run (maths, status derivation) lives here too, one function per file with its test beside
  it; when there's no answer it returns `null`, never a guess.

## Layout

```
models/src/
├── core/         permanent floor: enums, UIDs, time, password, SupportedLocale, ApiError — never versioned
├── constants/    ERROR_CODES and other values both sides read
├── catalogs/     reference data (verticals, notification events, weights)
├── dtos/v2/<group>/        shapes of returned objects, one per object
└── endpoints/v2/<group>/   request/response schemas, mirroring controllers/v2/<group>/
sdk/src/
├── client/request.ts       the one request wrapper: validates request before, response after; never throws;
│                           returns { ok, data } | { ok: false, status, error }
└── endpoints/v2/<group>/   one function per endpoint, named as its controller
```

`endpoints/` mirrors `controllers/`: same group folders, same file names. The contract file, the SDK function and
the controller share one name.

## DTOs

- **One shape per object, named after it** (`Account`, `Item`), always with everything relevant; **a list
  returns the same shape as a single item** (decision 2026-11-08). One shape means one hydrator, and a screen
  never has to fetch again for a field the list left out. Split into `…Preview` (lists) and `…Details` (one
  resource) only in a large-scale production build where list payload size measurably matters; even then the two
  share leaf schemas and never duplicate fields.
- A version owns its DTOs and endpoint schemas: never make one generation import another's. Shared primitives
  come from `core/`.
- Never-stored shapes (live numbers, job progress) are marked as such in their docblock.
- Responses carry `message` plus a named payload (`{ message, accounts }`), never a bare array.

## Backward compatibility

Applies when **Clients can be out of date: yes**. Mobile users cannot be force-updated; old builds are in the wild for weeks. **Deployed endpoints are frozen
contracts, append-only.**

- **Breaking:** removing a field, renaming a JSON field, changing a field's type, removing or renaming an
  endpoint, changing method or path.
- **Safe:** adding optional response fields (old clients ignore them); adding optional request fields the backend
  handles when absent.
- A breaking change is a **new endpoint** (next version path); the old one keeps working until old clients are
  gone. A wire rename is never one edit: a new field on a new endpoint version plus a deletion of the old at the
  next cutover.
- **To stop returning a field, null it; don't delete it.** A `.nullable()` field is still required: Zod rejects the
  key being absent. Emit `null`, keep the key, tag `@deprecated`.
- **Always mark deprecated things `@deprecated`:** in models `/** @deprecated Back-compat only — <why>; always
  <default>. Stop returning once old clients roll off. */` above the field/schema/enum (tag the definition site;
  tag the whole schema when all of it is back-compat); in the backend a matching `// @deprecated back-compat:`
  comment above the literal that emits the default. One `grep -rn "@deprecated"` must surface every shim so the
  purge is mechanical.
- Don't lean on the SDK's leniency toward response-schema failures; write server changes that satisfy the old
  schema on their own.
- **The cutover recipe:** raise the min-version wall, wait out the window, delete the generation's controller,
  route, endpoint and DTO trees and barrels, orphan-scan what only they referenced, drop their columns in one
  migration, purge the `@deprecated` symbols whose readers are gone, regenerate indexes, typecheck, update docs.

## When frontend and backend ship together

Applies when **Clients can be out of date: no**. An app distributed in lockstep (TestFlight, same deploy window), or a single-user tool where the server
serves the built client, has no old clients: **rename or remove fields outright, no `@deprecated` aliases**. Keep
such DTOs lean. The exception applies only to that scope; anything a store-distributed client reads keeps the
full treatment.

## Validation loop prevention

Request and response schemas are separate (see `40-syntax.md`). A request schema that requires a server-only
field causes infinite validation failures on every client.
