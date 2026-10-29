import { createHash } from 'node:crypto';
import { FormatId, LayoutId, render } from '../index';
import { COMBOS, docFor } from '../testing/docs';
import { asPoster, fixtureImage, newCanvas, pixels } from '../testing/fixture';

const assets = { dancers: fixtureImage() };

function hashOf(doc: unknown): string {
  const canvas = newCanvas();
  render(doc, assets, asPoster(canvas));
  return createHash('sha256').update(pixels(canvas)).digest('hex');
}

describe('render without line styles', () => {
  it.each(COMBOS)('with layout %s on %s and no line style, draws the 0.4.0 pixels', (layout, format) => {
    const doc = docFor(layout, format);

    const hash = hashOf(doc);

    expect(hash).toMatchSnapshot();
  });

  it('with empty lineStyles and lineTies, draws the same pixels as without them', () => {
    const doc = docFor(LayoutId.PictureRight, FormatId.Story);
    const plain = hashOf(doc);

    const empty = hashOf({ ...doc, lineStyles: {}, lineTies: [] });

    expect(empty).toBe(plain);
  });
});
