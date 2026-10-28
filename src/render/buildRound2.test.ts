import { FormatId } from '../enums/FormatId';
import { LayoutId } from '../enums/LayoutId';
import { FORMAT_SIZES } from '../formats';
import { render } from '../index';
import { geometry } from '../layout/geometry';
import { docFor } from '../testing/docs';
import { recordText, type DrawnText } from '../testing/drawnText';
import { asPoster, fixtureImage, newCanvas } from '../testing/fixture';

const ARCH_BODIES: [LayoutId, FormatId][] = [
  [LayoutId.Arch, FormatId.Story],
  [LayoutId.PhoneArch, FormatId.Phone],
];
const HEADER_TEXT = ['KIZOMBA', 'WORKSHOP', 'Saturday 31 October'];
const SMALL_TEXT = ['Party pass includes', 'Salsa & Bachata room', 'Kizomba dedicated room', '2 drinks', 'with Jimmy & Ismini'];
const MIN_SMALL_PX = 30;
const BALANCE_U = 40;
const GAP_U = 40;
const BASE = 1080;

function drawn(layout: LayoutId, format: FormatId): { texts: DrawnText[]; report: ReturnType<typeof render> } {
  const canvas = newCanvas();
  let report: ReturnType<typeof render> | undefined;
  const texts = recordText(canvas, () => {
    report = render(docFor(layout, format), { dancers: fixtureImage() }, asPoster(canvas));
  });
  return { texts, report: report as ReturnType<typeof render> };
}

const sizeOf = (texts: DrawnText[], text: string): number => texts.find((t) => t.text === text)?.size ?? 0;
const unit = (format: FormatId): number => Math.min(FORMAT_SIZES[format].width, FORMAT_SIZES[format].height) / BASE;

describe('render arch flank prices', () => {
  it.each(ARCH_BODIES)('with layout %s on format %s, sets both flank labels at one size', (layout, format) => {
    const { texts } = drawn(layout, format);

    expect(sizeOf(texts, 'per hour')).toBeCloseTo(sizeOf(texts, 'Party pass'), 1);
  });
});

describe('render arch body columns', () => {
  it.each(ARCH_BODIES)('with layout %s on format %s, starts the right body column no more than 40u below the left one', (layout, format) => {
    const { width, height } = FORMAT_SIZES[format];
    const body = geometry(layout, width, height).body;

    const { texts } = drawn(layout, format);

    const inBody = texts.filter((t) => t.y >= body.y && t.y < body.y + body.h);
    const mid = body.x + body.w / 2;
    const start = (side: DrawnText[]): number => Math.min(...side.map((t) => t.y));
    const left = start(inBody.filter((t) => t.x < mid));
    const right = start(inBody.filter((t) => t.x >= mid));
    expect(right - left).toBeLessThanOrEqual(BALANCE_U * unit(format));
  });

  it.each(ARCH_BODIES)('with layout %s on format %s, sets the includes and footer at 30px real or more', (layout, format) => {
    const { texts } = drawn(layout, format);

    SMALL_TEXT.forEach((text) => expect(sizeOf(texts, text)).toBeGreaterThanOrEqual(MIN_SMALL_PX));
  });
});

describe('render picture-bottom', () => {
  it('on a story, places the picture below the measured body end and stands it on the frame edge', () => {
    const { height } = FORMAT_SIZES[FormatId.Story];

    const { texts, report } = drawn(LayoutId.PictureBottom, FormatId.Story);

    const bodyEnd = Math.max(...texts.filter((t) => !HEADER_TEXT.includes(t.text)).map((t) => t.bottom));
    const picture = report.picture ?? { x: 0, y: 0, w: 0, h: 0 };
    expect(picture.y).toBeGreaterThanOrEqual(Math.floor(bodyEnd + GAP_U * unit(FormatId.Story)));
    expect(height - (picture.y + picture.h)).toBeLessThanOrEqual(1);
  });
});
