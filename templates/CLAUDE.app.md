# <app> — App Development Guide

Guidance for Claude Code when working in `<app>/`. The root `CLAUDE.md` and `.claude/rules/` apply in full,
especially `80-frontend.md`, `85-design-system.md` and `90-copy-and-i18n.md`.

**Platform:** <iOS + Android native / web>. **Audience:** <who uses this app>. The root guide's **Project
options** (Frontend apps, Client platform, Languages) decide which sections of the rules apply here.

## HARD RULE: The Production Database Is Out of Reach

Claude never connects to a production database: no writes and no reads (no `SELECT`, no `EXPLAIN`, no schema
inspection), not even if the owner asks. When a task needs production facts, write the query and hand it over;
the owner runs it. Full rule: `95-security-and-privacy.md`, "Production is out of reach".

## Check before you build

| You need | Check here first |
| --- | --- |
| a UI component | `<shared>/client/components/` |
| a spacing, colour, type value | `<shared>/client/theme/theme.ts` |
| a client utility or hook | `<shared>/client/` |
| an API call pattern | `<shared>/client/api/caller.ts` |
| a Zod schema or enum | `<shared>/models/src/core/` |
| a DTO / endpoint schema | `<shared>/models/src/{dtos,endpoints}/v1/<group>` |
| an SDK function | `@<brand>/sdk/v1/<group>` |

App-specific code lives in `<app>/components/` and `<app>/hooks/` only when nothing shared fits and no other app
will need it. <Frontend apps: one → there is no shared client package; point the shared rows above at the
app's own `components/`, `theme/` and `api/` folders.>

## Structure

```
<app>/
├── app/            routes only: (auth)/ (onboarding)/ (app)/(tabs)/ … + _layout.tsx files
├── components/     app-specific components, folder per component (+ colocated <Name>.<lang>.json if multi-language)
├── contexts/ hooks/ providers/ utils/
└── i18n/appLocales.ts   multi-language only: registers every colocated namespace
```

## Copy and languages

**Languages: <en | en, <lang>>.** Copy rules from `90-copy-and-i18n.md` section 1 always apply (no dashes, sentence
case, one word per concept, glossary in the root guide).

<Delete one of the two paragraphs below.>

One language: copy is written directly in the source language; no translation layer, no `t()`, no JSON
namespaces. Repeated strings live once in a constants file or the owning component.

Multi-language: colocated `<Name>.<lang>.json`, registered in `i18n/appLocales.ts`, `useTranslation("<ns>")`
before any early return, every locale in every change. Register: <informal | formal>, per the per-language
notes in `90-copy-and-i18n.md`.

## Alerts, toasts, confirmations

`customAlert()` never `Alert.alert()`; `showToast()` never `Toast.show()`; every destructive action confirms
with a verb-labelled button.

## Key screens

| Screen | Route | Description |
| --- | --- | --- |
| <Home> | `(app)/(tabs)/home` | <one line> |

## Analytics

Typed catalog in `utils/analytics.ts`; `track()` only; no PII; events `<funnel>_<step>_<pastTenseAction>`.

## Common gotchas

<Dated bullets; native modules needing a dev-client rebuild; purpose strings; prebuild resets.>

See `README.md` for commands and device setup.
