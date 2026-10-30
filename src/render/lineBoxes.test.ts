import { FormatId, LayoutId, render, type Rect } from '../index';
import { docFor } from '../testing/docs';
import { asPoster, fixtureImage, newCanvas } from '../testing/fixture';

const assets = { dancers: fixtureImage() };
const EDGE = 0.5;

const within = (t: Rect, b: Rect): boolean => t.x >= b.x - EDGE && t.y >= b.y - EDGE && t.x + t.w <= b.x + b.w + EDGE && t.y + t.h <= b.y + b.h + EDGE;

function unionOf(rects: readonly Rect[]): Rect | null {
  if (rects.length === 0) {return null;}
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  return { x, y, w: Math.max(...rects.map((r) => r.x + r.w)) - x, h: Math.max(...rects.map((r) => r.y + r.h)) - y };
}

const sameRect = (a: Rect, b: Rect | null): boolean => b !== null && [a.x - b.x, a.y - b.y, a.w - b.w, a.h - b.h].every((d) => Math.abs(d) <= EDGE);

function reportFor(layout: LayoutId): ReturnType<typeof render> {
  return render(docFor(layout, FormatId.Story), assets, asPoster(newCanvas()));
}

describe('render lineBoxes', () => {
  it('with the default doc, reports a box for the title and the footer', () => {
    const report = reportFor(LayoutId.PictureRight);

    expect(Object.keys(report.lineBoxes)).toEqual(expect.arrayContaining(['title', 'footer']));
  });

  it('with the default doc, reports a box per schedule label that lies inside the poster', () => {
    const report = reportFor(LayoutId.PictureRight);

    const box = report.lineBoxes['schedule.0.label'];
    expect(box?.w).toBeGreaterThan(0);
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect(box?.y).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? -1) + (box?.w ?? 0)).toBeLessThanOrEqual(report.width);
    expect((box?.y ?? -1) + (box?.h ?? 0)).toBeLessThanOrEqual(report.height);
  });

  it('with the default doc, every line box equals the union of the text boxes inside it on all four edges', () => {
    const report = reportFor(LayoutId.PictureRight);

    const exact = Object.values(report.lineBoxes).every((b) => b !== undefined && sameRect(b, unionOf(report.textBoxes.filter((t) => within(t, b)))));
    expect(exact).toBe(true);
  });
});
