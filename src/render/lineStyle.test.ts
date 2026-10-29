import { FormatId, LayoutId, LineAlign, render, type FlierDoc, type LineStyle } from '../index';
import { docFor } from '../testing/docs';
import { recordText, type DrawnText } from '../testing/drawnText';
import { asPoster, fixtureImage, newCanvas } from '../testing/fixture';

const assets = { dancers: fixtureImage() };
const FOOTER = 'with Jimmy & Ismini';

function drawn(doc: FlierDoc): DrawnText[] {
  const canvas = newCanvas();
  return recordText(canvas, () => render(doc, assets, asPoster(canvas)));
}

function footerWith(style: LineStyle): DrawnText | undefined {
  const doc = docFor(LayoutId.PictureRight, FormatId.Story);
  return drawn({ ...doc, lineStyles: { footer: style } }).find((t) => t.text === FOOTER);
}

describe('render with lineStyles', () => {
  it('with a footer colour of #123456, fills the footer in #123456', () => {
    const color = '#123456';

    const footer = footerWith({ color });

    expect(footer?.color).toBe(color);
  });

  it('with a colour on schedule.0.label only, leaves the second schedule label in the theme colour', () => {
    const doc = docFor(LayoutId.PictureRight, FormatId.Story);
    const plain = drawn(doc).find((t) => t.text.startsWith('Level 2'));

    const styled = drawn({ ...doc, lineStyles: { 'schedule.0.label': { color: '#123456' } } }).find((t) => t.text.startsWith('Level 2'));

    expect(styled?.color).toBe(plain?.color);
  });

  it('with font Georgia, italic and weight 300, draws the footer as italic 300 Georgia over the theme body font', () => {
    const style: LineStyle = { font: 'Georgia', italic: true, weight: 300 };

    const footer = footerWith(style);

    expect(footer?.font).toMatch(/^italic 300 [\d.]+px "?Georgia"?/);
  });

  it('with a footer size scale of 1.5, sets the footer more than 20% larger than without', () => {
    const plain = footerWith({});

    const scaled = footerWith({ sizeScale: 1.5 });

    expect((scaled?.size ?? 0) / (plain?.size ?? 1)).toBeGreaterThan(1.2);
  });

  it('with a footer letter spacing of 0.1, draws it with 0.1 em between letters', () => {
    const footer = footerWith({ letterSpacing: 0.1 });

    expect(parseFloat(footer?.spacing ?? '0')).toBeCloseTo(0.1 * (footer?.size ?? 0), 1);
  });

  it('with a footer letter spacing of 0.1, draws it wider than without', () => {
    const plain = footerWith({});

    const spaced = footerWith({ letterSpacing: 0.1 });

    expect((spaced?.width ?? 0) / (spaced?.size ?? 1)).toBeGreaterThan((plain?.width ?? 0) / (plain?.size ?? 1));
  });

  it('with left, center and right alignment, moves the footer start rightwards in that order', () => {
    const starts = [LineAlign.Left, LineAlign.Center, LineAlign.Right].map((align) => footerWith({ align })?.x ?? 0);

    const [left = 0, center = 0, right = 0] = starts;

    expect([center > left, right > center]).toEqual([true, true]);
  });

  it('with a footer aligned right, ends it inside the right margin', () => {
    const doc = docFor(LayoutId.PictureBottom, FormatId.Story);
    const texts = drawn({ ...doc, lineStyles: { footer: { align: LineAlign.Right } } });

    const footer = texts.find((t) => t.text === FOOTER);

    expect(Math.round((footer?.x ?? 0) + (footer?.width ?? 0))).toBeLessThanOrEqual(1080 - Math.round(1080 * 0.045));
  });
});
