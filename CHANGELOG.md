# Changelog

## 0.6.0

- FLIER-2 "Flier Studio follow-ups" D30 (sample parity, gap table `apps/flier-studio/docs/design/FLIER-2-sample-parity/gap.md`), all optional:
- `tuning.headerTop` (title top, px at a 1080 short edge), `tuning.titleScriptGap` / `tuning.scriptTitleGap` (separate gaps between the header lines), `tuning.titleScale` / `tuning.titleBottomScale`.
- `rows.icons` (`RowIcon` person / people / ticket per schedule and price row, optional `size`): a filled disc with a white line icon; a short list repeats its last icon.
- `rows.dividers` (`thickness`, `color`, `gap`, `toPicture`, `reach`): a rule above the venue and below every row but the last; `toPicture` runs each rule to the picture edge, drawn under the picture.
- `picture.overlap` (`scale` 1-1.5, `dx`, `dy`): the picture grows and shifts over the rows, stays on the canvas, and text is drawn over it.
- `BackgroundStyle.Brush`: deterministic dry-brush strokes beside the picture in `palette.brush`.
- `PaletteId.KizombaSample` (measured: page #fefefe, title #6d645d, ink #45372f, accent #ad8164, script #e5bb97, icon #cca383, rule #d5bca8, brush) and `FontSetId.KizombaSample` (Anton / Sacramento / Barlow Semi Condensed). Optional palette fields `script`, `icon`, `rule`, `brush`.
- `RenderReport.ruleBoxes`. Docs without the new fields render pixel-identical to 0.5.0 (45 sha256 snapshots unchanged).

## 0.5.0

- FLIER-2 "Flier Studio follow-ups" AC-38/39/40 (D25, D26, D29): optional `FlierDoc.lineStyles`, a per-line override keyed by line path (`title`, `venue.1`, `schedule.0.time`, `items.2.date`, see `LINE_KEY_PATTERN`) with `font`, `sizeScale`, `color`, `weight`, `italic`, `letterSpacing` (em) and `align` (`LineAlign`).
- Optional `FlierDoc.lineTies` plus helpers `sameWidth(doc, a, b)` (drawn widths equal within 1px, grown to the wider, inside the margins) and `sameSize(doc, a, b)` (one font size). Ties are resolved at layout time, so a theme or font switch keeps them.
- `validateFlierDoc` checks both (own keys only, so `__proto__` is rejected); the validator now supports `pattern`, `propertyNames`, schema-valued `additionalProperties` and `boolean`.
- `PosterContext.letterSpacing` is optional; it is only set when a line has letter spacing.
- Docs without `lineStyles`/`lineTies` render pixel-identical to 0.4.0 (sha256 of every layout x format pinned in a snapshot).

## 0.4.0

- FLIER-2 "Flier Studio follow-ups" D6 polish: optional `FlierDoc.tuning` with `headerGap` (closes the empty band between a stacked header and the body) and `itemDateScale` (list date script size). Docs without `tuning` render pixel-identical to 0.3.0.

## 0.3.0

- FLIER-2 "Flier Studio follow-ups" theme 2 Golden hour: `GoldenHorizon` palette, Coastal font set, Horizon sky-only background.
- Breaking for custom contexts: `PosterContext.createLinearGradient` is now required (the Horizon sky is a linear gradient). A custom `PosterContext` must implement it.

## 0.2.7

- P-B "Phone arch": the title block starts at the top margin (0.05h) instead of under a clock zone; the arch picture starts at 0.47h and grows.
- The footer stays attached under the includes list: columns never spread space between them, and both stay in one column.

## 0.2.5

- Own-key checks: the schema validator and the asset lookup use `Object.hasOwn`, so a `__proto__` key is rejected and an imageId such as `constructor` is reported missing.
- `placeContain(image, region, { anchor, alignX, scale })` takes an options object (was 5 positional parameters).
- Named size and gap constants; ESLint now lints tests and `src/testing`.
- README: install, usage, canvas injection, fonts, type floor, schema version policy.

## 0.2.4

- Type floor: every text run is at least 30px at a 1080 short edge (scaled per format by short edge). When a layout cannot fit its text at the floor, the picture yields space to the body (and a header stacked above it) in 2.5% steps.
- picture-bottom sizes the picture to the space left once the body holds the floor (about 0.56w for the real tall couple on a story); it stays whole on the bottom edge.
- Text zones pick two columns when that sets the type at least 15% larger.

## 0.2.3

- `picture-bottom`: the picture is sized for a tall cut-out (design aspect 0.57): 80% of the width, standing on the bottom edge; the header and body share the top (at least 25% of the height) and shrink to fit. The picture is never cropped.

## 0.2.2

- Arch flanks: both flank price groups use one size per line, so "per hour" and "Party pass" match.
- Two-column bodies: the break is chosen from heights measured at the column width, and the shorter column spreads its group gaps so both columns end together.
- Footer base size 38 (was 34): includes and footer stay at 30 px or more on story and phone arch layouts.
- `picture-bottom`: the picture region starts 40u under the body's measured end, spans the middle 80% of the width and runs to the frame edge.
- Venue gets a rule below as well as above (`FlowGroup.ruleBelow`).

## 0.2.1

- Venue pin: an accent disc with a pin glyph beside the venue lines; `RenderReport.iconBoxes`.
- Includes block drawn as a heading plus bullets, with no card.
- Price groups stay in one column when a wide body splits into two (`FlowGroup.keepWithNext`).
- `desktop-safe` landscape gets an explicit logo rect beside the title; `desktop-arch` logo enlarged and no longer pushed down to the title cap; `RenderReport.logo`.
- List rows: date at 0.7x, 48 px between dated rows.

## 0.2.0

- Layouts `arch`, `phone-clock-safe`, `phone-arch`, `desktop-safe`, `desktop-arch` (FLIER-1 D4 "Keep all layouts"); `LAYOUT_CATALOGUE` + `defaultLayoutFor`.
- Critic r2 nits: arch prices moved up beside the arch top, lighter arch fill, phone arch top at 63% height, desktop arch 40 px right, logo top on the title cap top.
- Includes block uses one size for every line; `RenderReport.backdrop`; `Palette.arch`.

## 0.1.0

- FlierDoc schema + validator, render, exportPng, 4 layouts, 5 formats, palettes, font sets, Kizomba example.
