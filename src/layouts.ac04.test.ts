import { flierDocSchema, FontSetId, FormatId, LayoutId, PALETTES, PaletteId, render, validateFlierDoc } from './index';
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
