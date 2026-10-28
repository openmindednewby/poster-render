import { PALETTES, render, type Rect } from '../index';
import { COMBOS, docFor, withoutPicture } from '../testing/docs';
import { asPoster, fixtureImage, hexRgb, inset, newCanvas, opaqueRectOn, pixels } from '../testing/fixture';

type Box = { x0: number; y0: number; x1: number; y1: number };

const intersects = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function foreignPixelsInside(canvas: ReturnType<typeof newCanvas>, box: Box, bg: number[]): number {
  const d = pixels(canvas);
  let count = 0;
  for (let y = Math.max(0, box.y0); y < Math.min(canvas.height, box.y1); y++) {
    for (let x = Math.max(0, box.x0); x < Math.min(canvas.width, box.x1); x++) {
      const i = (y * canvas.width + x) * 4;
      if (d[i] !== bg[0] || d[i + 1] !== bg[1] || d[i + 2] !== bg[2]) count++;
    }
  }
  return count;
}

describe('render AC-02 nothing covers the picture', () => {
  it.each(COMBOS)('with layout %s on format %s, draws no text or card pixel where the picture is opaque', (layout, format) => {
    const doc = docFor(layout, format);
    const withPic = render(doc, { dancers: fixtureImage() }, asPoster(newCanvas()));
    const bare = newCanvas();

    render(withoutPicture(doc), {}, asPoster(bare));

    const mask = inset(opaqueRectOn(withPic.picture ?? { x: 0, y: 0, w: 0, h: 0 }), -1);
    expect(foreignPixelsInside(bare, mask, hexRgb(PALETTES[doc.palette].background))).toBe(0);
  });

  it.each(COMBOS)('with layout %s on format %s, keeps every text, card and pin box off the picture', (layout, format) => {
    const doc = docFor(layout, format);

    const report = render(doc, { dancers: fixtureImage() }, asPoster(newCanvas()));

    const pic = report.picture ?? { x: 0, y: 0, w: 0, h: 0 };
    expect(report.textBoxes.length).toBeGreaterThan(0);
    expect([...report.textBoxes, ...report.cardBoxes, ...report.iconBoxes].filter((b) => intersects(b, pic))).toEqual([]);
  });

  it.each(COMBOS)('with layout %s on format %s and very long text, shrinks every line inside the canvas', (layout, format) => {
    const doc = docFor(layout, format);
    doc.blocks.title = 'KIZOMBAKIZOMBAKIZOMBAKIZOMBA';
    doc.blocks.footer = 'with Jimmy & Ismini and all their friends from every dance school on the island tonight';

    const report = render(doc, { dancers: fixtureImage() }, asPoster(newCanvas()));

    const outside = report.textBoxes.filter((b) => b.x < 0 || b.y < 0 || b.x + b.w > report.width || b.y + b.h > report.height);
    expect(outside).toEqual([]);
    expect(report.textBoxes.filter((b) => intersects(b, report.pictureRegion))).toEqual([]);
  });
});
