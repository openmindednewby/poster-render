import { FormatId } from '../enums/FormatId';
import { LayoutId } from '../enums/LayoutId';
import { kizombaWorkshop } from '../examples/kizombaWorkshop';
import { FORMAT_SIZES } from '../formats';
import { render } from '../index';
import { docFor } from '../testing/docs';
import { recordText } from '../testing/drawnText';
import { asPoster, fixtureImage, newCanvas, tallImage } from '../testing/fixture';
import type { FlierDoc, RenderReport } from '../types';

const ROUNDING = 0.005;
const HALF = 0.5;
const SIDE_SHORT = 0.375;

const R3_SHARE: Record<string, Partial<Record<FormatId, number>>> = {
  [LayoutId.PictureRight]: { story: 0.42, post: SIDE_SHORT, square: SIDE_SHORT, phone: 0.42, desktop: 0.42 },
  [LayoutId.PictureLeft]: { story: 0.42, post: SIDE_SHORT, square: SIDE_SHORT, phone: 0.42, desktop: 0.42 },
  [LayoutId.List]: { story: 0.35, phone: 0.35, desktop: 0.36 },
  [LayoutId.Arch]: { story: 0.3248, post: 0.3248, square: 0.3248, phone: 0.3248, desktop: 0.276 },
  [LayoutId.PhoneClockSafe]: { story: 0.26, post: 0.26, square: 0.26, phone: 0.26, desktop: 0.352 },
  [LayoutId.PhoneArch]: { story: 0.24, post: 0.24, square: 0.24, phone: 0.24, desktop: 0.252 },
  [LayoutId.DesktopSafe]: { story: 0.2816, post: 0.2816, square: 0.2816, phone: 0.2816, desktop: 0.2618 },
  [LayoutId.DesktopArch]: { story: 0.3744, post: 0.3744, square: 0.3744, phone: 0.3744, desktop: 0.2976 },
};

const CASES: [LayoutId, FormatId, number][] = Object.entries(R3_SHARE).flatMap(([layout, shares]) =>
  Object.entries(shares).map(([format, share]): [LayoutId, FormatId, number] => [layout as LayoutId, format as FormatId, share]),
);

function renderTall(layout: LayoutId, format: FormatId): RenderReport {
  const doc: FlierDoc = { ...kizombaWorkshop, layout, format };
  return render(doc, { dancers: tallImage(), logo: fixtureImage() }, asPoster(newCanvas()));
}

describe('render picture region under the type floor', () => {
  it.each(CASES)('with a tall picture on layout %s and format %s, keeps a picture region of at least %s of the frame', (layout, format, share) => {
    const { width, height } = FORMAT_SIZES[format];

    const report = renderTall(layout, format);

    const region = report.pictureRegion;
    expect((region.w * region.h) / (width * height)).toBeGreaterThanOrEqual(share - ROUNDING);
  });

  it.each([
    [LayoutId.PictureRight, FormatId.Post],
    [LayoutId.PictureRight, FormatId.Square],
    [LayoutId.PictureLeft, FormatId.Post],
    [LayoutId.PictureLeft, FormatId.Square],
  ])('on layout %s and format %s, sets all text in one column at most half the width and the picture on the bottom edge', (layout, format) => {
    const { width, height } = FORMAT_SIZES[format];

    const report = renderTall(layout, format);

    const left = Math.min(...report.textBoxes.map((b) => b.x));
    const right = Math.max(...report.textBoxes.map((b) => b.x + b.w));
    const region = report.pictureRegion;
    expect(right - left).toBeLessThanOrEqual(width * HALF);
    expect(region.y + region.h).toBe(height);
    expect(region.w).toBeGreaterThanOrEqual(Math.floor(width * HALF));
  });

  it('on picture-left square, starts the title and the body on one left edge', () => {
    const doc: FlierDoc = { ...kizombaWorkshop, layout: LayoutId.PictureLeft, format: FormatId.Square };
    const canvas = newCanvas();

    let report: RenderReport | null = null;

    const texts = recordText(canvas, () => {
      report = render(doc, { dancers: tallImage(), logo: fixtureImage() }, asPoster(canvas));
    });

    const title = texts.find((t) => t.text === doc.blocks.title);
    const pin = (report as RenderReport | null)?.iconBoxes[0];
    expect(Math.round(title?.x ?? -1)).toBe(Math.round(pin?.x ?? -2));
  });
});

describe('render phone-arch reading order', () => {
  it('on a phone, sets Level 1 before Level 2 in the same column', () => {
    const doc = docFor(LayoutId.PhoneArch, FormatId.Phone);
    const canvas = newCanvas();

    const texts = recordText(canvas, () => {
      render(doc, { dancers: tallImage() }, asPoster(canvas));
    });

    const level1 = texts.find((t) => t.text.startsWith('Level 1'));
    const level2 = texts.find((t) => t.text.startsWith('Level 2'));
    expect(Math.round(level1?.x ?? -1)).toBe(Math.round(level2?.x ?? -2));
    expect(level1?.y ?? Infinity).toBeLessThan(level2?.y ?? -Infinity);
  });
});
