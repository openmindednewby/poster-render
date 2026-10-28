import { BackgroundStyle, FONT_SETS, FontSetId, FormatId, LayoutId, PALETTES, PaletteId, render, validateFlierDoc } from '../index';
import { docFor } from '../testing/docs';
import { asPoster, fixtureImage, hexRgb, newCanvas, pixels } from '../testing/fixture';

const NEAR = 3;

function horizonDoc(): ReturnType<typeof docFor> {
  return { ...docFor(LayoutId.PictureRight, FormatId.Story), palette: PaletteId.GoldenHorizon, fonts: FontSetId.Coastal, background: BackgroundStyle.Horizon };
}

function rgbAt(canvas: ReturnType<typeof newCanvas>, x: number, y: number): number[] {
  const i = (y * canvas.width + x) * 4;
  return Array.from(pixels(canvas).slice(i, i + 3));
}

const close = (a: number[], b: number[]): boolean => a.every((v, i) => Math.abs(v - (b[i] ?? 0)) <= NEAR);

describe('horizon background', () => {
  it('with golden horizon, coastal fonts and the horizon background, passes the schema', () => {
    const doc = horizonDoc();

    const result = validateFlierDoc(doc);

    expect(result.ok).toBe(true);
  });

  it('with the coastal font set, uses Fraunces, Allura and Jost', () => {
    const fonts = FONT_SETS[FontSetId.Coastal];

    const families = [fonts.display, fonts.script, fonts.body].map((f) => f.split(',')[0]);

    expect(families).toEqual(['"Fraunces"', '"Allura"', '"Jost"']);
  });

  it('with the horizon background, paints the first sky stop at the top edge', () => {
    const canvas = newCanvas();

    render(horizonDoc(), { dancers: fixtureImage() }, asPoster(canvas));

    const sky = PALETTES[PaletteId.GoldenHorizon].sky ?? [];
    expect(close(rgbAt(canvas, 2, 0), hexRgb(sky[0]?.[1] ?? ''))).toBe(true);
  });

  it('with the horizon background, paints the last sky stop at the bottom edge, no sea band', () => {
    const canvas = newCanvas();

    render(horizonDoc(), { dancers: fixtureImage() }, asPoster(canvas));

    const sky = PALETTES[PaletteId.GoldenHorizon].sky ?? [];
    expect(close(rgbAt(canvas, 2, canvas.height - 1), hexRgb(sky[sky.length - 1]?.[1] ?? ''))).toBe(true);
  });
});
