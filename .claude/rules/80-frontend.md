---
paths:
  - "<app>/**"
  - "<shared>/client/**"
---

# Frontend (React Native / React)

Applies when **Frontend apps** is not `none` in the root guide. The React Native specifics (secure storage,
Expo Router, native folders) apply when **Client platform** includes React Native.

## Check before you build

| You need | Check first |
| --- | --- |
| a UI component | `<shared>/client/components/` (lists, overlays, pickers, buttons, inputs) |
| a spacing, colour, type or shadow value | `<shared>/client/theme/theme.ts` tokens |
| a client utility or hook | `<shared>/client/` |
| an API call pattern | `<shared>/client/api/caller.ts` (`callAuthed`, `callPublic`) |
| a schema, enum, DTO, endpoint schema | the models package |
| an SDK function | `@<brand>/sdk/v2/<group>` |

If something almost fits, generalise the shared version rather than creating a local parallel. App-specific code
lives in `<app>/components/` and `<app>/hooks/` only when there is no reasonable shared equivalent and no other
app will need it. Used by two apps → move it to the shared client package (**Frontend apps: several**). With
one app there is no shared client package: the table's shared rows become the app's own `components/`,
`theme/` and `api/` folders, and the same check-before-build applies inside the app.

## Where code goes

- `app/` is routes only (screens and `_layout` files); every file there is a screen. Non-route code (components,
  hooks, utils, contexts) lives outside `app/`.
- A component lives in its own folder with `index.tsx`, `styles.ts` when non-trivial, and (multi-language
  projects only) its colocated `<Name>.<lang>.json` files. A screen's own pieces sit beside it.
- Business logic (domain maths, status derivation, formatting) lives in pure, tested modules; screens stay thin
  and compose shared components.
- Every screen, component, hook and utility starts with a docblock.

## Talking to the API

- **Components never call `fetch`.** Every call goes through the SDK function for its endpoint, wrapped in
  `callAuthed(navigation, (jwt) => fn({ jwt, … }))` or `callPublic(...)`. The wrapper ensures the token, handles
  generic errors (network, timeout, validation, rate limit, OTP, forced update), shows the user message and
  navigates to login when needed. Hooks that call the API receive `navigation`.
- The request wrapper **never throws** for HTTP/network errors: `{ ok: true, data }` or `{ ok: false, status,
  error }`. Handle `!result.ok` explicitly.
- **Error messages come from the backend and are shown as they arrive** (decision 2026-11-08): every server
  message is a plain, human-readable sentence written for the user, so the client shows `error.message` (with the
  code in small print for lookup) and keeps no mapping table. The client adds a specific branch only when the
  error changes what the screen does (navigate to a fix step, offer a retry), not to re-word it. A **multi-
  language** app is the exception: there the backend's message is English, and the client maps each domain code
  to localised copy. In that case `handleSpecificErrorManually: true` **mutes every domain code ≥ 1000**, so the
  error branch must map each code the endpoint can throw **and end in an `else` fallback alert**; an unmapped
  code must never fail silently.
- **Never sign out (or take any destructive session action) on a transient or protocol-level status.** The SDK
  synthesises 408 on timeout, 429 is rate limiting, 426 is the forced-update wall, 401 is already handled. Only a
  specific domain signal (404 + the "account gone" code on `/me`) means the session is dead; never a `status >=
  400` range check.
- Fetch-dedupe keys are committed only on success; on failure keep stale data, settle loading, leave the key
  un-burned so a refocus retries, and offer pull-to-refresh.
- Standard cache times: detail queries `staleTime` 10 min / `gcTime` 7 days via `useDetailQuery`; paginated lists
  via `usePagedList`.
- A payment provider's client-side "success" is not authoritative: poll the backend until the webhook books it,
  then show the success beat, then call back the host.

## Loading, busy and error states

- **Every busy/loading flag resets on every exit path: `try/finally`.** "The caller navigates away and unmounts"
  is not a reset: components rendered with an `open` prop from a layout never unmount, so a leaked flag re-
  disables their buttons the next time they open (a recorded incident).
- **A non-dismissable sheet always keeps at least one enabled exit.** Never let one state combination disable
  every button while the sheet can't be closed; a phase with no buttons exits by a timer or host callback, not a
  flag.
- Releasing a navigation block and navigating in the same tick does not work; defer the navigation a tick and
  keep a terminal "done" phase so the form can't be re-submitted.
- Submit buttons show a loading state and are disabled while busy (double-tap prevention: `if (loading) return`).
- Guard clauses before hooks are a bug; `<PageLoading />` while essential data loads; `RefreshControl` for pull-
  to-refresh; `useScrollToTop` on scrollable screens.
- Error states: network errors get a friendly message; domain errors (≥ 1000) are handled where actionable;
  empty states have meaningful UI; 404 is handled. No stack traces, no internal ids shown; generic fallback
  "Something went wrong".
- Edge cases: empty required fields blocked by validation; long text truncates or wraps; images have fallbacks.

## Feedback and confirmations

- `customAlert()` from the shared client, never `Alert.alert()`; `showToast()`, never `Toast.show()` directly.
  Toast for non-blocking success, alert for blocking errors.
- **Every destructive, irreversible or high-impact action confirms first** (log out, money movements, moderation
  with side effects, account state changes, anything that emails a user). `customAlert(title, body, [{ text:
  "Cancel", style: "cancel" }, { text: "<Verb>", style: "destructive", onPress }])`: cancel first, the confirm
  button labelled with the verb ("Reject", "Ban", "Delete tag"), never "OK"; the body names the concrete
  consequence. Plain reads and navigation never get a confirmation.
- Mutations update the relevant context on success.

## Contexts and hooks

```ts
const MyContext = createContext<MyContextType>({ value: null, setValue: () => {}, hydrated: false });
export function useMyContext() {
  const ctx = useContext(MyContext);
  if (!ctx) throw new Error("useMyContext must be used within MyContextProvider");
  return ctx;
}
```

- The accessor throws outside its provider; defaults are provided, not `undefined`; async-loaded contexts expose a
  `hydrated` flag; complex context APIs are wrapped in `useMemo`.
- One hook owns a multi-surface flow end to end (the request, analytics, cache invalidation, error presentation),
  so two surfaces can't drift; hosts keep only their surface-specific success toast and navigation.
- Refetch rather than invalidate after a money action, and refetch everything entangled, so no host has to
  remember a key.

## Security

- Tokens in `SecureStore`, never `AsyncStorage`, never React state or context, never logged (even in dev), never
  displayed. All authed calls through `callAuthed`.
- Only publishable-class keys in `EXPO_PUBLIC_*` / `NEXT_PUBLIC_*`.
- No PII in analytics payloads (no email, name, handle, token): enums, booleans, counts, prefixed uids only.

## Analytics

- One typed event catalog per app (`utils/analytics.ts`); `track("event", payload)` is compile-checked against it;
  never call the provider's `capture()` directly. One shared project across surfaces, separated by an `app`
  super-property; never prefix event names per surface, never a second project.
- Event naming: `<funnel>_<step>_<pastTenseAction>`. Screen names come from the router's route pattern, never the
  resolved URL (ids never leak). Session replay stays off (a spend decision).

## Navigation

- Expo Router: `Link`, `router`, `useLocalSearchParams` from `expo-router`. Route groups for auth state
  (`(auth)`, `(app)`, `(onboarding)`). `replace` for auth flows, `reset` on logout, `goBack` after a form
  succeeds. Block back while a two-phase submit is in flight.
- `ios/` and `android/` are generated (CNG); never hand-edit them; configure native behaviour in `app.config.ts`
  and config plugins. Adding a native module needs a dev-client rebuild and its iOS purpose strings in every app
  that bundles it.

## Money display

- Money is integer cents in the ledger currency; display via one formatting hook that knows the viewer's locale
  and rate. Owned/transactional figures show the ledger currency primary with a `≈` local secondary line;
  estimates show one currency. Strings interpolated inside `t()` stay in the ledger currency.

## Performance

`FlatList` with `keyExtractor` (and `getItemLayout` when possible) for long lists; memoised callbacks passed to
children; memoised expensive values; large contexts split; a chart that recomputes heavily follows its inputs
with `useDeferredValue`.

## Pre-finish checklist

- [ ] No direct `fetch`; every call through the SDK + `callAuthed`/`callPublic`
- [ ] Busy flags reset in `try/finally`; non-dismissable sheets keep an exit
- [ ] `handleSpecificErrorManually` branches end in a fallback alert
- [ ] Destructive actions confirm with a verb-labelled button
- [ ] Shared components and tokens only; nothing hand-rolled that the design system owns
- [ ] Copy follows `90-copy-and-i18n.md` (no dashes, sentence case, one word per concept); in a multi-language
      project every user-facing string goes through `t()` with every locale present
- [ ] Docblocks on every new screen, component, hook; the app guide updated
