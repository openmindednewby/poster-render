import { PALETTES, render } from '../index';
import { COMBOS, docFor } from '../testing/docs';
import { asPoster, fixtureImage, hexRgb, newCanvas, pixels } from '../testing/fixture';

const SAMPLE_OFFSET = 0.4;

describe('render venue pin', () => {
  it.each(COMBOS)('with layout %s on format %s and a venue, draws the accent pin disc beside the venue', (layout, format) => {
    const doc = docFor(layout, format);
    const canvas = newCanvas();

    const report = render(doc, { dancers: fixtureImage() }, asPoster(canvas));

    expect(report.iconBoxes).toHaveLength(1);
    const pin = report.iconBoxes[0] ?? { x: 0, y: 0, w: 0, h: 0 };
    const x = Math.round(pin.x + pin.w / 2 - pin.w * SAMPLE_OFFSET);
    const y = Math.round(pin.y + pin.h / 2);
    const i = (y * canvas.width + x) * 4;
    expect(Array.from(pixels(canvas).slice(i, i + 3))).toEqual(hexRgb(PALETTES[doc.palette].accent));
  });

  it.each(COMBOS)('with layout %s on format %s and no venue, draws no pin', (layout, format) => {
    const doc = docFor(layout, format);
    delete doc.blocks.venue;

    const report = render(doc, { dancers: fixtureImage() }, asPoster(newCanvas()));

    expect(report.iconBoxes).toEqual([]);
  });
});
