import { flierDocSchema, FontSetId, FormatId, LAYOUT_CATALOGUE, LayoutId, PALETTES, PaletteId, render, validateFlierDoc } from './index';
import { docFor, LAYOUTS } from './testing/docs';
import { asPoster, fixtureImage, hexRgb, newCanvas, pixels } from './testing/fixture';

describe('flierDocSchema AC-04 layouts, palettes and fonts', () => {
  it('with the layout enum, offers picture right, picture left, picture bottom and list', () => {
    const layouts = flierDocSchema.properties?.layout?.enum;

    const named = ['picture-right', 'picture-left', 'picture-bottom', 'list'].filter((l) => layouts?.includes(l));

    expect(named).toHaveLength(4);
  });

  it('with the palette and font enums, offers at least three of each as schema values', () => {
    const props = flierDocSchema.properties;

    const counts = [props?.palette?.enum?.length ?? 0, props?.fonts?.enum?.length ?? 0];

    expect(counts.every((n) => n >= 3)).toBe(true);
  });

  it.each(Object.values(PaletteId))('with palette %s, paints that palette background', (palette) => {
    const doc = { ...docFor(LayoutId.PictureRight, FormatId.Square), palette, fonts: FontSetId.Modern };
    const canvas = newCanvas();

    render(doc, { dancers: fixtureImage() }, asPoster(canvas));

    expect(Array.from(pixels(canvas).slice(0, 3))).toEqual(hexRgb(PALETTES[palette].background));
  });

  it('with each layout on the story format, places the picture in a different spot', () => {
    const spots = LAYOUTS.map((l) => render(docFor(l, FormatId.Story), { dancers: fixtureImage() }, asPoster(newCanvas())).picture);

    const keys = new Set(spots.map((r) => JSON.stringify(r)));

    expect(keys.size).toBe(LAYOUTS.length);
  });

  it('with a doc using every layout value, validates each one', () => {
    const results = LAYOUTS.map((l) => validateFlierDoc(docFor(l, FormatId.Post)).ok);

    expect(results.every(Boolean)).toBe(true);
  });
});

describe('flierDocSchema AC-04 design layouts', () => {
  it('with the layout enum, offers the arch, phone clock-safe, phone arch, desktop safe and desktop arch layouts', () => {
    const layouts = flierDocSchema.properties?.layout?.enum;

    const named = ['arch', 'phone-clock-safe', 'phone-arch', 'desktop-safe', 'desktop-arch'].filter((l) => layouts?.includes(l));

    expect(named).toHaveLength(5);
  });

  it.each(LAYOUT_CATALOGUE.flatMap((e) => e.formats.map((f): [LayoutId, FormatId] => [e.id, f])).filter(([l]) => l !== LayoutId.PictureBottom && l !== LayoutId.List))(
    'with layout %s on its designed format %s and a bottom anchor, stands the picture on the bottom edge',
    (layout, format) => {
      const report = render(docFor(layout, format), { dancers: fixtureImage() }, asPoster(newCanvas()));

      const pic = report.picture ?? { x: 0, y: 0, w: 0, h: 0 };
      expect(pic.y + pic.h).toBe(report.height);
    },
  );

  it.each([LayoutId.Arch, LayoutId.PhoneArch, LayoutId.DesktopArch])('with arch layout %s, paints the arch behind the picture off every text box', (layout) => {
    const canvas = newCanvas();
    const doc = docFor(layout, FormatId.Story);

    const report = render(doc, { dancers: fixtureImage() }, asPoster(canvas));

    const arch = report.backdrop ?? { x: 0, y: 0, w: 0, h: 0 };
    const i = (Math.round(arch.y + arch.h * 0.75) * canvas.width + Math.round(arch.x + 2)) * 4;
    expect(Array.from(pixels(canvas).slice(i, i + 3))).toEqual(hexRgb(PALETTES[doc.palette].arch));
    expect(report.textBoxes.filter((b) => b.x < arch.x + arch.w && arch.x < b.x + b.w && b.y < arch.y + arch.h && arch.y < b.y + b.h)).toEqual([]);
  });

  it('with a picture-right layout, paints no arch', () => {
    const report = render(docFor(LayoutId.PictureRight, FormatId.Story), { dancers: fixtureImage() }, asPoster(newCanvas()));

    expect(report.backdrop).toBeNull();
  });
});
