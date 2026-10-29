import { BackgroundStyle, FormatId, LayoutId, PictureAnchor, RowIcon, render } from '../index';
import { docFor, sampleDoc } from '../testing/docs';
import { asPoster, fixtureImage, newCanvas, pixels } from '../testing/fixture';
import type { FlierDoc, Rect, RenderReport, RowTheme } from '../types';

const assets = { dancers: fixtureImage(), logo: fixtureImage() };
const NONE: Rect = { x: 0, y: 0, w: 0, h: 0 };
const PAGE = 254;
const plain = (): FlierDoc => docFor(LayoutId.PictureRight, FormatId.Story);
const withRows = (rows: RowTheme): FlierDoc => ({ ...plain(), rows });
const draw = (doc: FlierDoc): RenderReport => render(doc, assets, asPoster(newCanvas()));
const ICONS = { schedule: [RowIcon.Person, RowIcon.People], prices: [RowIcon.Ticket] };

function notPage(doc: FlierDoc): number {
  const canvas = newCanvas();
  render(doc, assets, asPoster(canvas));
  const data = pixels(canvas);
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    n += data[i] === PAGE && data[i + 1] === PAGE && data[i + 2] === PAGE ? 0 : 1;
  }
  return n;
}

describe('render row icons', () => {
  it('with an icon per schedule row and one price icon, draws a disc on every row next to the venue pin', () => {
    const doc = withRows({ icons: ICONS });

    const report = draw(doc);

    expect(report.iconBoxes).toHaveLength(5);
  });

  it('with an icon size of 106px, draws every row disc at one diameter of at most 106px', () => {
    const doc = withRows({ icons: { ...ICONS, size: 106 } });

    const discs = draw(doc).iconBoxes.slice(1);

    expect(new Set(discs.map((d) => Math.round(d.w))).size).toBe(1);
    expect(discs[0]?.w).toBeLessThanOrEqual(106);
  });
});

describe('render divider rules', () => {
  it('with dividers, draws a rule above the venue and below every row but the last', () => {
    const doc = withRows({ dividers: { thickness: 2 } });

    const report = draw(doc);

    expect(report.ruleBoxes).toHaveLength(5);
  });

  it('with a 2px divider, draws every rule at most 2px tall', () => {
    const doc = withRows({ dividers: { thickness: 2 } });

    const report = draw(doc);

    expect(Math.max(...report.ruleBoxes.map((r) => r.h))).toBeLessThanOrEqual(2);
  });

  it('with dividers running to the picture, ends every rule level with the picture at its left edge', () => {
    const doc = withRows({ dividers: { thickness: 2, toPicture: true } });

    const report = draw(doc);

    const picture = report.picture ?? NONE;
    const beside = report.ruleBoxes.filter((r) => r.y >= picture.y && r.y <= picture.y + picture.h);
    expect(beside.length).toBeGreaterThan(0);
    expect(beside.every((r) => Math.abs(r.x + r.w - picture.x) <= 1)).toBe(true);
  });
});

describe('render picture overlap', () => {
  it('with overlap scale 1.1 shifted left and up, grows the picture 10%, moves it left and up and keeps it on the canvas', () => {
    const doc: FlierDoc = { ...plain(), picture: { imageId: 'dancers', anchor: PictureAnchor.Bottom, scale: 1, overlap: { scale: 1.1, dx: -0.06, dy: -0.056 } } };
    const before = draw(plain()).picture ?? NONE;

    const report = draw(doc);

    const p = report.picture ?? NONE;
    expect(Math.abs(p.w - before.w * 1.1)).toBeLessThanOrEqual(2);
    expect(p.x).toBeLessThan(before.x);
    expect(p.y).toBeLessThan(before.y);
    expect(p.x >= 0 && p.y >= 0 && p.x + p.w <= report.width && p.y + p.h <= report.height).toBe(true);
  });
});

describe('render brush backdrop', () => {
  it('with the brush background, paints strokes the solid background does not', () => {
    const doc = sampleDoc();

    const brushed = notPage(doc);

    expect(brushed).toBeGreaterThan(notPage({ ...doc, background: BackgroundStyle.Solid }));
  });
});

describe('render the Kizomba sample theme', () => {
  it('with the sample palette, fonts and options, still draws the logo, the includes list and the footer', () => {
    const doc = sampleDoc();

    const report = draw(doc);

    expect(report.logo).not.toBeNull();
    expect(report.textBoxes).toHaveLength(draw({ ...plain(), logo: { imageId: 'logo' } }).textBoxes.length);
  });
});
