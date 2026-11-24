# Copy and internationalisation

The glossary and the per-language notes are per project; the rules travel.

**Scope (decision 2026-11-09):** sections 1 and 2 (copy rules, legal documents) apply to every project. Section 3
(translation machinery) applies **only when the project's root `CLAUDE.md` declares more than one language**. A
one-language app writes its copy directly in the source language and adds no translation layer: no `t()`, no
JSON namespaces, no i18n library. The root `CLAUDE.md` states which it is (`Languages: en` or `Languages: en, <lang>`)
so the rule is never guessed from the code.

## 1. Voice and punctuation (every project)

- **No em dashes (`—`) or en dashes (`–`) in user-facing copy**, in any language. They read as machine-written.
  Use a period, comma, colon or parentheses, or split the sentence. ASCII hyphens inside words are fine. Developer-
  facing docs and comments are out of scope (use them sparingly there too).
- Sentence case, warm, plain punctuation. Clear over clever, specific over generic, direct over vague. No
  marketing fluff, no unexplained claims, no buzzwords.
- **One word per concept, the same in code, API, pages and docs.** Keep a glossary table in the project's
  `CLAUDE.md` (word, means, never) and make a rename reach every layer in one change. Product units are named
  consistently (one name per unit, never a synonym).
- Canonical names for legal documents and apps: always the full name, capitalised as a proper noun; never a bare
  "Terms", never a synonym. Internal identifiers (keys, slugs) are exempt.
- Entry points lead with value, not mechanism; the one screen that must explain *how* explains it once.
- Regulated-domain copy (health, finance, legal) follows the project's claims rules in its root `CLAUDE.md`
  before anything else; when unsure, describe the data or the diary, never the outcome.
- **Copy stays out of logic even in a one-language app.** A string that appears on more than one screen (a
  product term, a state label, a confirmation sentence) lives once, in a constants file or the component that
  owns it, and is imported. Error messages shown to the user come from the backend (see `50-backend.md`).
- Developer-facing strings (`throw new Error(...)`, logs, docblocks) are English in every project.

## 2. Legal documents (when the project has them, every project)

One canonical source folder (`legal/<document>/<lang>.md`), plain GFM, rendered by the site at build time; never a
site-local copy. Code and terms move together (a PR that changes data collected, third parties, retention or
money mechanics updates the document in the same PR). Where several languages exist they move in lockstep with
one authoritative language, "Last updated" is bumped, versioned acceptance is coordinated with backend
constants, and served URLs are never removed or renamed.

## 3. Translation machinery (multi-language projects only)

Everything below is skipped when the root `CLAUDE.md` declares a single language. Adding a second language later
is a project decision the owner makes; it is introduced in one dedicated pass, not screen by screen.

### Every user-facing string is translated

- **No hardcoded copy in any file that renders text**: screens, components, contexts, hooks, alerts, toasts,
  notification templates, emails. Every locale exists for every string from day one; a missing key falls back to
  the source language silently and ships untranslated copy.
- Consume with `const { t } = useTranslation("<ns>")` (before any early return) and `t("key")`. Non-component
  utils use the i18n singleton (`i18n.t("key", { ns })`). Each sub-component calls `useTranslation` itself; no
  prop-drilling `t`.
- Module-level functions that return strings take `t` as a typed parameter (`TFunction<"<ns>">`, never bare
  `TFunction`, which resolves to the default namespace).
- Module-level constants can't call `t()`; move config that needs translation inside the component body. Store
  translation **keys** in memos and call `t()` at render.

### Colocate translations next to what uses them

- **A component's strings live in `<Name>.<lang>.json` files next to it** (a screen's beside the screen, a
  context's beside the context). A feature shared by several components may use one `<feature>.<lang>.json` at
  the feature-folder level (the canonical vocabulary of a feature: method names, states, actions; flow narration
  stays in each sheet's own namespace). **There is no central `locales/` catalog.**
- Register colocated namespaces at boot in the app's `i18n/appLocales.ts` (`registerLocale("ns", { en, <lang> })`)
  and augment the resources interface so `t()` is type-checked against the keys. Shared-package namespaces are
  registered in the package's `i18n/index.ts`. On a Next.js site, a `resources.ts` registry maps each namespace to
  lazy loaders per language (keep the thunks, they code-split).
- **Every namespace file starts with a `"//"` key** noting where it is used: `"//": "Used in: app/(app)/(tabs)/map.tsx (map namespace)."`.
- **Key parity across locales is mandatory**: same key set, same nesting, added/renamed/split in every locale in
  the same change. Verify with a parity script (`node -e` over the files) and validate JSON after every edit
  (typographic quotes such as `„…"` end a JSON string early: escape the closing one).
- One namespace per screen/feature; namespace names are globally flat; a namespace may differ from its filename.
  Don't reach into another screen's namespace; `common` is only for truly cross-app strings.
- Use stable identifier keys (`pricing.faq`), never the source text as the key. Interpolation
  `{{variable}}`; inline links via `<Trans>` or split-on-link-text.

### Write each language natively

- **Never translate one language into the other.** Author each locale separately, thinking in that language;
  the files may phrase the same idea differently. Literal translations read stiff.
- Pluralisation: prefer the library's native plural categories over manual `count > 1` checks.

### Per-language notes

Each additional language gets its own notes in the project's copy of this file: register, sentence shape,
gendered forms, capitalisation of canonical names. The notes below are the ones for Czech; replace or extend
them for the project's `<lang>`.

- Czech is full sentences, not clipped English-style fragments: a finite verb and a natural connective. Buttons,
  labels and headings stay short; descriptive copy becomes a sentence.
- Pick the register per surface and keep it: apps **tykání** (informal), a site that addresses
  professional customers **vykání** (formal); copy ported between surfaces is converted on the way in. Avoid gendered
  past forms where a rephrase is natural; use the slashed form (`Připraven/a`) when unavoidable; don't mix the
  two strategies.
- Canonical names in Czech: first word capitalised and declined as needed.
