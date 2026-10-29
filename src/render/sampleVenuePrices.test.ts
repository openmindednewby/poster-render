import { FONT_SETS, FormatId, LayoutId, PALETTES, render } from '../index';
import { docFor } from '../testing/docs';
import { asPoster, fixtureImage, hexRgb, newCanvas, pixels } from '../testing/fixture';
import { recordText, type DrawnText } from '../testing/drawnText';
import type { FlierDoc, RowTheme } from '../types';

const assets = { dancers: fixtureImage() };
const withRows = (rows: RowTheme): FlierDoc => ({ ...docFor(LayoutId.PictureRight, FormatId.Story), rows });
const DISC_EDGE = 0.45;
const texts = (doc: FlierDoc): DrawnText[] => {
  const canvas = newCanvas();
  return recordText(canvas, () => render(doc, assets, asPoster(canvas)));
};

describe('render sample venue and price labels', () => {
  it('with a bare venue pin, leaves the page colour where the pin disc edge was', () => {
    const doc = withRows({ venue: { bare: true } });
    const canvas = newCanvas();

    const report = render(doc, assets, asPoster(canvas));

    const pin = report.iconBoxes[0] ?? { x: 0, y: 0, w: 0, h: 0 };
    const x = Math.round(pin.x + pin.w / 2 - pin.w * DISC_EDGE);
    const i = (Math.round(pin.y + pin.h / 2) * canvas.width + x) * 4;
    expect(Array.from(pixels(canvas).slice(i, i + 3))).toEqual(hexRgb(PALETTES[doc.palette].background));
  });

  it('with the venue in the body face, draws every venue line in the body font', () => {
    const doc = withRows({ venue: { body: true } });

    const fonts = texts(doc).filter((t) => doc.blocks.venue?.includes(t.text)).map((t) => t.font);

    expect(fonts.map((f) => f.endsWith(FONT_SETS[doc.fonts].body))).toEqual(doc.blocks.venue?.map(() => true));
  });

  it('with a price label scale of 0.5, draws the price labels at most half their default size', () => {
    const base = withRows({});
    const scaled = withRows({ priceLabelScale: 0.5 });
    const size = (doc: FlierDoc): number => Number(/(\d+(?:\.\d+)?)px/.exec(texts(doc).find((t) => t.text === 'per hour')?.font ?? '')?.[1] ?? 0);

    const ratio = size(scaled) / size(base);

    expect(ratio).toBeLessThanOrEqual(0.5 + 0.01);
  });
});
