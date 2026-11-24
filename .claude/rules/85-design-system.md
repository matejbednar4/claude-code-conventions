---
paths:
  - "<app>/**"
  - "<shared>/client/**"
  - "**/*.css"
---

# Design system rules

Applies when **Frontend apps** is not `none` in the root guide; the React Native component names are the
shared client package's and are renamed to the project's. The **values** (hex, fonts, scales) are per project
and live in the theme file; the **rules** below travel. Read this before writing or editing any component.

## Tokens are the source of truth

- Every colour, size, radius, shadow and font comes from the theme (`theme.ts` in RN; CSS custom properties at
  the top of `globals.css` on the web). **Never hardcode a hex, size, radius or shadow that exists as a token.**
  Hex values quoted in a guide are for reference only; the token in code wins, and the guide is updated when a
  token changes.
- **Every margin, padding and gap comes from the spacing scale.** No arbitrary values (`padding: 15`); if
  something feels between two steps, pick the nearer step. A token that doesn't exist silently drops the whole
  declaration on the web: check the token list first.
- Screen-edge inset is always the semantic `layout.screenPadding`, not a raw scale step, so every edge is tunable
  in one place; raw `spacing.*` is for gaps between elements and component-internal padding.
- Components fill their container's width (`width: "100%"`); the parent controls constraints. No `aspectRatio`
  for height; no `%` values but `"100%"`.

## The rule that gets broken most: borders vs shadows

**Do not put borders around cards, tiles or containers.** Separation comes from shadow, not outline lines. A
border makes everything look corporate and flat. Reach for `shadow.card`. Borders are allowed only for: hairline
dividers between rows inside a card (`color.border.divider`); dashed empty/"add" states; the edges that
`CustomButton` / `CustomTextInput` own (never drawn by hand).

## Elevation ladder

Every surface sits on exactly one rung, picked by what the element is: `shadow.chip` (filter chips, unselected
pills), `shadow.card` (resting cards, panels), `shadow.button` (a FAB hovering alone over scrolling content),
`shadow.float` (modals, sheets, dialogs), `shadow.text` (a lifted glyph, the only shadow for type; an object of
text-shadow props, not a box shadow). Shadows are the palette's tinted values, **never black**. Buttons own their
elevation; don't stack shadows. A pinned bottom CTA bar carries the top shadow; the button inside stays flat.

## Colour: roles, not decoration

- Pull every colour from the active theme. 60/30/10: ~60% background + surfaces, ~30% content, ~10% accent.
  Accents are small; two accents never appear as large blocks and never touch each other.
- `ink` anchors everything: all text, all headings, all primary actions. **Text colour is never grey**; use the
  warm text tiers (`text.secondary`, `text.tertiary`); tertiary only for captions and meta, never body copy.
- **Green only for money and success**; **red only for errors and destructive actions** (plus one sanctioned
  not-yet-happened loss: a scarcity or expiry warning, in the soft `dangerBg` pair, never solid). An open
  result or neutral figure is ink, never green or red.
- Text on a coloured fill uses the matching `color.on.*`, never plain black or grey.
- Bottom sheets with white children sit on `color.background`, not `surface` (white on white).
- The accent marks "now / here / live": the current page, focus, the price now, a countdown under two days.

## Typography

- Two families via `theme.font` (`heading` serif for names, headers and moments; `body` sans for everything
  functional). Always apply the composed text styles (`display`, `title`, `heading`, `body`, `bodyMedium`,
  `label`, `caption`, `micro`, `amount*`); never assemble font + size + weight by hand.
- The heading serif never below 18–19px and never below weight 600; bigger means bolder. Never in buttons,
  labels, captions or body. The sans never heavier than 500; emphasis from size and colour, not weight.
- **Money stays in sans** (`amount` styles), never serif. Sentence case everywhere; ALL CAPS only for `micro`
  overlines.
- Colour is not baked into text styles; pass it separately. Load only the weights the ladder uses. Fonts are
  self-hosted; no Google Fonts import on the web.

## Radius

Three tiers, the contrast intentional: `radius.structure` (cards, images, panels, inputs, sheets),
`radius.button` (buttons), `radius.pill` (999: pills, tags, chips, badges, always fully round). No rounded corners
on a single-sided border/accent strip.

## Layout, safe areas, rhythm

- **Never hardcode notch/status-bar/home-indicator padding.** Always safe-area inset + a spacing token:
  `paddingTop: insets.top + spacing.sm`; web: `env(safe-area-inset-*)` + token. A `SafeAreaView` already consumes
  the inset: don't add a full screen padding on top.
- Vertical rhythm from the scale: safe top → first row `sm`; title → subtitle `xs–sm` (one unit, tight); title
  block → content `xl`; section → section `xl`; scroll end → `insets.bottom + layout.screenPadding`, or
  `useNavBottomPadding()` under a floating tab bar (use its value as the padding, don't add to it).
- One top bar component (`TopMenu`) owns the safe-area top inset; screens never add their own `insets.top`.
  Every screen's content starts `layout.screenPadding` below the bar.
- **Every interactive element has a hit area ≥ 44pt** (touch area including padding, not visible size). Inline
  icons 16–20px, 24px max decorative.
- Cards side by side are equal heights; one thing leads each card (the figure it exists for is the largest thing
  on it); background facts are one quiet caption line, never a figure of their own; fold what's rare; remove
  before adding; three or more items with a "when" are rows, never a sentence.

## Buttons: pick the tier by weight, never by colour

`primary` (**one per screen**), `soft` (a high-traffic secondary you want tapped often: social login), `secondary`
(subordinate: back, dismiss, "maybe later"), `tertiary` (text-only: skip, resend), `destructive`. Never recolour a
button to signal importance; colour stays semantic. Inline partially-tappable text uses `PressableText`, not a
tertiary button. Icons are passed as a name string and tinted by the component; `iconPosition="trailing"` for an
onward glyph.

## Primitives own their look; never hand-roll

`CustomButton`, `CustomTextInput` (drive state via `error` / `valid` props; focus uses ink, not accent),
`Toggle` (never RN `Switch`), `StarRating`, `CustomPicker`, `GeneralVerticalList` for paginated lists,
`BottomOverlay`/`BottomSheet`, `PageLoading`, `BottomActionBar` for pinned CTAs, `CustomMedia` for every image.
**Adjust before you add:** a need an existing component almost meets becomes a prop or variant on it, never a new
component; a new shared component needs two call sites and the owner's OK. Never fork a shared form per app; extend
via props (injected api, `locale`, `draftKey`).

## Press feedback and selected states

- Every tappable surface spreads `pressFeedbackStyle({ pressed, hovered })` into its `Pressable` style function
  (`CustomButton` does it internally). Writing `opacity: pressed ? 0.x : 1` by hand is the signal to stop.
- Selected pill/chip/toggle: `ink` fill + `on.ink` text. Unselected: white surface + `shadow.chip` (not a border).
  Chosen multi-select tags: `brand`/`accent` fill with matching `on.*` text and an inline close icon. Active nav:
  ink icon + label; inactive: `text.tertiary`.
- Icons: one library (e.g. Ionicons, outline weight) in RN; on a hand-drawn system one grid and one pen. Never mix
  icon sets.

## Working on a screen

- **A layout change starts as a mockup, never as code**: a clickable artifact in the project's look with invented
  numbers only, a switch for every state that changes the layout, and a notes block (what changed and why,
  numbered open questions). Feedback goes into the mockup at the same link; code starts when the owner says build it.
  Build as drawn; an unanswered open question is built as drawn and said so. Record the mockup link and date in
  the screen's docblock and the guide.
- A new page picks the nearest existing page shape, never a fifth. Pages compose the same pieces in the same
  order (header → sticky bar → stats → cards); a page never draws its own head, row, pill or card.
- Web marketing pages: semantic HTML (one H1, logical H2/H3, real links and buttons), server-rendered, content in
  the HTML, tokens via utility classes only, accessibility as a baseline, structured data only when truthful.

## Pre-finish checklist

- [ ] No borders on cards/containers (shadow does separation); every surface on one `shadow.*` rung, tinted
- [ ] Buttons `CustomButton`, inputs `CustomTextInput`, toggles `Toggle`; tier by weight; one `primary` per screen
- [ ] Top/bottom padding = safe-area inset + spacing token; rhythm from the scale; no arbitrary px
- [ ] Brand/accent are accents, not fills, and don't touch; green = money/success only; red = error/destructive only
- [ ] Text on fills uses `on.*`; text never grey; headings in the serif ≥ 600, functional text in the sans ≤ 500; money in sans
- [ ] Every tap target ≥ 44; corners from the three radius tiers
- [ ] Busy flags reset on every exit; a no-`onClose` sheet keeps one enabled exit
- [ ] A layout change was a mockup first; a "design only" change touched no logic
