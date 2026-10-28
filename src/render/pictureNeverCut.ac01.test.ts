import { render } from '../index';
import { COMBOS, docFor } from '../testing/docs';
import { asPoster, fixtureImage, inset, newCanvas, opaqueRectOn, pixels } from '../testing/fixture';

type Box = { x0: number; y0: number; x1: number; y1: number };

const isGreen = (d: Uint8ClampedArray, i: number): boolean => d[i] < 10 && d[i + 1] > 245 && d[i + 2] < 10 && d[i + 3] === 255;

function greenStats(canvas: ReturnType<typeof newCanvas>, box: Box): { total: number; insideNotGreen: number } {
  const d = pixels(canvas);
  let total = 0;
  let insideNotGreen = 0;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const green = isGreen(d, (y * canvas.width + x) * 4);
      if (green) {total++;}
      if (!green && x >= box.x0 && x < box.x1 && y >= box.y0 && y < box.y1) {insideNotGreen++;}
    }
  }
  return { total, insideNotGreen };
}

describe('render AC-01 picture never cut', () => {
  it.each(COMBOS)('with layout %s on format %s, draws the whole opaque picture inside the canvas', (layout, format) => {
    const canvas = newCanvas();

    const report = render(docFor(layout, format), { dancers: fixtureImage() }, asPoster(canvas));

    expect(report.picture).not.toBeNull();
    const o = opaqueRectOn(report.picture ?? { x: 0, y: 0, w: 0, h: 0 });
    expect(o.x).toBeGreaterThanOrEqual(0);
    expect(o.y).toBeGreaterThanOrEqual(0);
    expect(o.x + o.w).toBeLessThanOrEqual(canvas.width);
    expect(o.y + o.h).toBeLessThanOrEqual(canvas.height);
    const stats = greenStats(canvas, inset(o, 2));
    expect(stats.insideNotGreen).toBe(0);
    expect(Math.abs(stats.total - o.w * o.h)).toBeLessThanOrEqual(2 * (o.w + o.h) + 4);
  });
});
