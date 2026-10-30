import { FormatId, LayoutId, LineAlign, render, validateFlierDoc, type FlierDoc, type RenderReport } from '../index';
import { docFor } from '../testing/docs';
import { recordText } from '../testing/drawnText';
import { asPoster, fixtureImage, newCanvas } from '../testing/fixture';

const assets = { dancers: fixtureImage() };
const LONG = 'with Jimmy & Ismini';
const MARGIN = 0.045;
const EDGE = 0.5;
const THEME_WIDTH = 300;

function footerAt(widthScale: number | undefined, align?: LineAlign, textWidth: number | undefined = THEME_WIDTH): { size: number; report: RenderReport } {
  const base = docFor(LayoutId.PictureRight, FormatId.Story);
  const doc: FlierDoc = { ...base, rows: { ...base.rows, textWidth }, blocks: { ...base.blocks, footer: LONG }, lineStyles: { footer: { sizeScale: 3, ...(widthScale === undefined ? {} : { widthScale }), ...(align === undefined ? {} : { align }) } } };
  const canvas = newCanvas();
  const size = recordText(canvas, () => render(doc, assets, asPoster(canvas))).filter((t) => t.text.length > 2 && LONG.includes(t.text)).reduce((max, t) => Math.max(max, t.size), 0);
  const report = render(doc, assets, asPoster(newCanvas()));
  return { size, report };
}

function inSafeArea(report: RenderReport): boolean {
  const box = report.lineBoxes.footer;
  const m = Math.round(Math.min(report.width, report.height) * MARGIN);
  if (box === undefined) {return false;}
  return box.x >= m - EDGE && box.x + box.w <= report.width - m + EDGE;
}

describe('render with lineStyles widthScale', () => {
  it('with a width-capped footer and a widthScale of 1.5, draws it larger than at the theme width', () => {
    const capped = footerAt(undefined).size;

    const widened = footerAt(1.5).size;

    expect(widened).toBeGreaterThan(capped);
  });

  it('with a widthScale of 1.5 left-aligned, keeps the footer inside the poster safe edge', () => {
    const { report } = footerAt(1.5, LineAlign.Left, undefined);

    const safe = inSafeArea(report);

    expect(safe).toBe(true);
  });

  it('with a widthScale of 1.5 centred, keeps the footer inside the poster safe edge', () => {
    const { report } = footerAt(1.5, LineAlign.Center, undefined);

    const safe = inSafeArea(report);

    expect(safe).toBe(true);
  });

  it('with a footer already at the layout text width and a widthScale of 1.5, lets it run past the text area towards the safe edge', () => {
    const { report } = footerAt(1.5, undefined, undefined);

    const right = (report.lineBoxes.footer?.x ?? 0) + (report.lineBoxes.footer?.w ?? 0);

    expect(right).toBeGreaterThan(report.pictureRegion.x);
  });

  it('with a widthScale of 0.5, keeps every footer line within half the theme width', () => {
    const { report } = footerAt(0.5);

    const box = report.lineBoxes.footer;

    expect(box?.w).toBeLessThanOrEqual(THEME_WIDTH * 0.5 + EDGE);
  });

  it.each([0.4, 2])('with a widthScale of %p, rejects the doc', (widthScale) => {
    const base = docFor(LayoutId.PictureRight, FormatId.Story);

    const result = validateFlierDoc({ ...base, lineStyles: { footer: { widthScale } } });

    expect(result.ok).toBe(false);
  });
});
