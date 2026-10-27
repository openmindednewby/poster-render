# @dloizides/poster-render

One JSON document (`FlierDoc`) in, one poster out. Used by Flier Studio (FLIER-1 "Flier Studio").

- `flierDocSchema`: JSON Schema of `FlierDoc` (give it to an LLM as `response_format`).
- `validateFlierDoc(input)`: `{ ok, doc }` or `{ ok: false, errors }`; errors read `blocks.title: is required`.
- `render(doc, assets, canvas)`: validates first (throws `FlierDocError` before touching the canvas), resizes the canvas to the format, draws, returns a `RenderReport` (picture rect, text and card boxes).
- `exportPng(canvas)`: PNG `Blob` of the canvas size.
- Formats: story 1080x1920, post 1080x1350, square 1080x1080, phone 1170x2532, desktop 2560x1440.
- Layouts: `picture-right` (E-A), `picture-left` (E-B), `arch` (E-C), `picture-bottom`, `list`, `phone-clock-safe` (P-A, top kept clear for the lock-screen clock), `phone-arch` (P-B), `desktop-safe` (D-A, text clear of desktop icons and the taskbar), `desktop-arch` (D-B). `LAYOUT_CATALOGUE` lists id, design id, label, description and designed formats (for the app picker and the LLM prompt); `defaultLayoutFor(format)` gives E-A / P-A / D-A.
- Arch layouts paint a soft arch (palette `arch`, about 4% off the ground) behind the picture only, inside the picture region; prices sit large on either side. The includes block is set at one size for every line. Palettes: `sand`, `night`, `sea`, `rose`. Font sets: `classic`, `modern`, `elegant` (the app loads the web fonts).
- The picture is placed contain + anchor in its own region: never cropped, never faded, drawn last, and no text or card is laid out in its region. Text shrinks to fit, never overflows.
- Example: `kizombaWorkshopDocs` (3 workshops + list flier), `kizombaWorkshop` (the list flier).
