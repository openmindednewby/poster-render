import { FormatId, LayoutId, render, validateFlierDoc, type FlierDoc } from '../index';
import { docFor } from '../testing/docs';
import { recordText } from '../testing/drawnText';
import { asPoster, fixtureImage, newCanvas } from '../testing/fixture';

const assets = { dancers: fixtureImage() };
const LONG = 'with Jimmy & Ismini and all the Bailemos teachers';

function footerSize(widthScale: number | undefined): number {
  const base = docFor(LayoutId.PictureRight, FormatId.Story);
  const doc: FlierDoc = { ...base, blocks: { ...base.blocks, footer: LONG }, lineStyles: { footer: { sizeScale: 3, widthScale } } };
  const canvas = newCanvas();
  return recordText(canvas, () => render(doc, assets, asPoster(canvas))).find((t) => t.text === LONG)?.size ?? 0;
}

describe('render with lineStyles widthScale', () => {
  it('with a width-capped footer and a widthScale of 1.5, draws it larger than at the theme width', () => {
    const capped = footerSize(undefined);

    const widened = footerSize(1.5);

    expect(widened).toBeGreaterThan(capped * 1.2);
  });

  it('with a widthScale of 2, rejects the doc', () => {
    const base = docFor(LayoutId.PictureRight, FormatId.Story);

    const result = validateFlierDoc({ ...base, lineStyles: { footer: { widthScale: 2 } } });

    expect(result.ok).toBe(false);
  });
});
