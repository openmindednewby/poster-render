# Changelog

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
