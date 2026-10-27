# @dloizides/poster-render

One JSON document (`FlierDoc`) in, one poster out. Used by Flier Studio (FLIER-1 "Flier Studio").

- `flierDocSchema`: JSON Schema of `FlierDoc` (give it to an LLM as `response_format`).
- `validateFlierDoc(input)`: `{ ok, doc }` or `{ ok: false, errors }`; errors read `blocks.title: is required`.
- `render(doc, assets, canvas)`: validates first (throws `FlierDocError` before touching the canvas), resizes the canvas to the format, draws, returns a `RenderReport` (picture rect, text and card boxes).
- `exportPng(canvas)`: PNG `Blob` of the canvas size.
- Formats: story 1080x1920, post 1080x1350, square 1080x1080, phone 1170x2532, desktop 2560x1440.
- Layouts: `picture-right`, `picture-left`, `picture-bottom`, `list`. Palettes: `sand`, `night`, `sea`, `rose`. Font sets: `classic`, `modern`, `elegant` (the app loads the web fonts).
- The picture is placed contain + anchor in its own region: never cropped, never faded, drawn last, and no text or card is laid out in its region. Text shrinks to fit, never overflows.
- Example: `kizombaWorkshopDocs` (3 workshops + list flier), `kizombaWorkshop` (the list flier).
