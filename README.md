# @dloizides/poster-render

One JSON document (`FlierDoc`) in, one poster out. Used by Flier Studio (FLIER-1 "Flier Studio").

- `flierDocSchema`: JSON Schema of `FlierDoc` (give it to an LLM as `response_format`).
- `validateFlierDoc(input)`: `{ ok, doc }` or `{ ok: false, errors }`; errors read `blocks.title: is required`.
- `render(doc, assets, canvas)`: validates first (throws `FlierDocError` before touching the canvas), resizes the canvas to the format, draws, returns a `RenderReport` (picture rect, text and card boxes).
- `exportPng(canvas)`: PNG `Blob` of the canvas size.
- Formats: story 1080x1920, post 1080x1350, square 1080x1080, phone 1170x2532, desktop 2560x1440.
- Layouts: `picture-right` (E-A "Picture right"), `picture-left` (E-B "Picture left"), `arch` (E-C "Arch"), `picture-bottom`, `list`, `phone-clock-safe` (P-A "Phone, clock clear": top kept clear for the lock-screen clock), `phone-arch` (P-B "Phone arch"), `desktop-safe` (D-A "Desktop, icons clear": text clear of desktop icons and the taskbar), `desktop-arch` (D-B "Desktop arch"). `LAYOUT_CATALOGUE` lists id, design id, label, description and designed formats (for the app picker and the LLM prompt); `defaultLayoutFor(format)` gives E-A "Picture right" / P-A "Phone, clock clear" / D-A "Desktop, icons clear" (D4 "Layouts: keep all").
- Arch layouts paint a soft arch (palette `arch`, about 4% off the ground) behind the picture only, inside the picture region; prices sit large on either side. The includes block is set at one size for every line. Palettes: `sand`, `night`, `sea`, `rose`. Font sets: `classic`, `modern`, `elegant` (the app loads the web fonts).
- Optional `tuning` (per-theme overrides, absent = layout default): `headerGap` (0-200 px at a 1080 short edge) starts the body that far under the last header line when the header sits above it; `itemDateScale` (0.5-2) scales the list date script.
- The picture is placed contain + anchor in its own region: never cropped, never faded, drawn last, and no text or card is laid out in its region. Text shrinks to fit, never overflows.
- Example: `kizombaWorkshopDocs` (3 workshops + list flier), `kizombaWorkshop` (the list flier).

## Install

```bash
npm install @dloizides/poster-render
```

## Usage

```ts
import { exportPng, kizombaWorkshop, render, validateFlierDoc } from '@dloizides/poster-render';

const checked = validateFlierDoc(kizombaWorkshop);
if (!checked.ok) {
  throw new Error(checked.errors.join('\n'));
}
const canvas = document.createElement('canvas');
const report = render(checked.doc, { dancers: pictureImage, logo: logoImage }, canvas);
const png = await exportPng(canvas);
```

## Canvas injection

`render` takes any canvas with a 2d context; the package has no canvas dependency.

- Browser: an `HTMLCanvasElement` (or `OffscreenCanvas`); assets are loaded `HTMLImageElement` / `ImageBitmap`.
- Node: `@napi-rs/canvas` (`createCanvas(1, 1)`, `loadImage(path)`); `render` resizes the canvas to the format.

## Fonts

The font sets name CSS families (`FONT_SETS`). The host loads them before `render`: in a browser with `document.fonts.load(...)` / `@font-face`, in Node with `GlobalFonts.registerFromPath` from `@napi-rs/canvas`. A missing font falls back to the default family and the text still fits.

## Type floor

Every text run is at least 30px at a 1080 short edge (40px on desktop 2560x1440). When a layout cannot fit its text at the floor, the picture gives space to the text.

## Schema version policy

`FlierDoc.version` is `1`. A field added as optional keeps version 1; a removed, renamed or retyped field raises the version and `validateFlierDoc` rejects the other version with `version: must be 1 (got N)`. A package major release goes with a new doc version.
