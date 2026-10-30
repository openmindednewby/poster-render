import { FormatId, LayoutId, render, type FlierDoc, type RenderReport } from '../index';
import { docFor } from '../testing/docs';
import { recordText } from '../testing/drawnText';
import { asPoster, fixtureImage, newCanvas } from '../testing/fixture';

const assets = { dancers: fixtureImage() };
const LONG = 'with Jimmy & Ismini';
const EDGE = 0.5;
const THEME_WIDTH = 200;

function footerAt(widthScale: number | undefined): { size: number; report: RenderReport } {
  const base = docFor(LayoutId.PictureRight, FormatId.Story);
  const doc: FlierDoc = { ...base, rows: { ...base.rows, textWidth: THEME_WIDTH }, blocks: { ...base.blocks, footer: LONG }, lineStyles: widthScale === undefined ? {} : { footer: { widthScale } } };
  const canvas = newCanvas();
  const size = recordText(canvas, () => render(doc, assets, asPoster(canvas))).filter((t) => t.text.length > 2 && LONG.includes(t.text)).reduce((max, t) => Math.max(max, t.size), 0);
  const report = render(doc, assets, asPoster(newCanvas()));
  return { size, report };
}

describe('render with lineStyles widthScale', () => {
  it('with a width-capped footer and a widthScale of 1.5, draws it larger than at the theme width', () => {
    const capped = footerAt(undefined).size;

    const widened = footerAt(1.5).size;

    expect(widened).toBeGreaterThan(capped);
  });

  it('with a widthScale of 0.5, keeps every footer line within half the theme width', () => {
    const { report } = footerAt(0.5);

    const box = report.lineBoxes.footer;

    expect(box?.w).toBeLessThanOrEqual(THEME_WIDTH * 0.5 + EDGE);
  });
});
