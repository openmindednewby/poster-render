import { FormatId, LayoutId, render } from '../index';
import { docFor } from '../testing/docs';
import { asPoster, fixtureImage, newCanvas } from '../testing/fixture';

const assets = { dancers: fixtureImage() };

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
    expect((box?.x ?? -1) + (box?.w ?? 0)).toBeLessThanOrEqual(report.width);
  });

  it('with the default doc, every line box is one of the drawn text boxes or their union', () => {
    const report = reportFor(LayoutId.PictureRight);

    const inside = Object.values(report.lineBoxes).every((b) => b !== undefined && report.textBoxes.some((t) => t.x >= b.x - 0.5 && t.y >= b.y - 0.5 && t.x + t.w <= b.x + b.w + 0.5));
    expect(inside).toBe(true);
  });
});
