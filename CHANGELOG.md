# Changelog

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
