import { FormatId, LayoutId, render, validateFlierDoc, type FlierDoc, type LineStyle } from '../index';
import { docFor } from '../testing/docs';
import { recordText } from '../testing/drawnText';
import { asPoster, fixtureImage, newCanvas } from '../testing/fixture';

const assets = { dancers: fixtureImage() };
const FOOTER_SIZE = 38;
const VENUE_SIZE = 58;
const BASE = 1080;

function drawnSize(doc: FlierDoc, text: string): { size: number; u: number } {
  const canvas = newCanvas();
  let u = 1;
  const drawn = recordText(canvas, () => {
    const report = render(doc, assets, asPoster(canvas));
    u = Math.min(report.width, report.height) / BASE;
  });
  return { size: drawn.filter((t) => t.text === text).reduce((max, t) => Math.max(max, t.size), 0), u };
}

function styledDoc(key: string, style: LineStyle): FlierDoc {
  const doc = docFor(LayoutId.PictureRight, FormatId.Story);
  return { ...doc, lineStyles: { [key]: style } };
}

describe('validateFlierDoc with unbounded line scales', () => {
  it.each([0.3, 3])('with a sizeScale and widthScale of %p, accepts the doc', (scale) => {
    const doc = styledDoc('footer', { sizeScale: scale, widthScale: scale });

    const result = validateFlierDoc(doc);

    expect(result.ok).toBe(true);
  });
});

describe('render with a user-set size', () => {
  it.each([0.3, 3])('with a footer sizeScale of %p, draws the footer at exactly that multiple of its theme size', (scale) => {
    const doc = styledDoc('footer', { sizeScale: scale });

    const { size, u } = drawnSize(doc, 'with Jimmy & Ismini');

    expect(size).toBeCloseTo(FOOTER_SIZE * scale * u, 1);
  });

  it('with a venue sizeScale of 1.2, draws the venue at 1.2 times its theme size, never smaller', () => {
    const doc = styledDoc('venue.0', { sizeScale: 1.2 });

    const { size, u } = drawnSize(doc, 'Bailemos');

    expect(size).toBeCloseTo(VENUE_SIZE * 1.2 * u, 1);
  });
});

describe('render with an unsized line and a widthScale', () => {
  it('with the footer squeezed to a 120 px text width and a widthScale of 3, draws the footer at its full theme size', () => {
    const base = docFor(LayoutId.PictureRight, FormatId.Story);
    const doc: FlierDoc = { ...base, rows: { ...base.rows, textWidth: 120 }, lineStyles: { footer: { widthScale: 3 } } };

    const { size, u } = drawnSize(doc, 'with Jimmy & Ismini');

    expect(size).toBeCloseTo(FOOTER_SIZE * u, 1);
  });
});
