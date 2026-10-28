import { FormatId } from '../enums/FormatId';
import { LayoutId } from '../enums/LayoutId';
import { FORMAT_SIZES } from '../formats';
import { render } from '../index';
import { docFor } from '../testing/docs';
import { recordText, type DrawnText } from '../testing/drawnText';
import { asPoster, fixtureImage, newCanvas } from '../testing/fixture';

const ARCH_BODIES: [LayoutId, FormatId][] = [
  [LayoutId.Arch, FormatId.Story],
  [LayoutId.PhoneArch, FormatId.Phone],
];
const TITLE_TOP_SHARE = 0.06;
const FOOTER_GAP_U = 40;
const BASE = 1080;

function drawn(layout: LayoutId, format: FormatId): DrawnText[] {
  const canvas = newCanvas();
  return recordText(canvas, () => {
    render(docFor(layout, format), { dancers: fixtureImage() }, asPoster(canvas));
  });
}

const textOf = (texts: DrawnText[], text: string): DrawnText | undefined => texts.find((t) => t.text === text);

describe('render phone arch title', () => {
  it('on a phone, starts the title at the top margin', () => {
    const { height } = FORMAT_SIZES[FormatId.Phone];

    const title = textOf(drawn(LayoutId.PhoneArch, FormatId.Phone), 'KIZOMBA');

    expect(title?.y ?? height).toBeLessThanOrEqual(height * TITLE_TOP_SHARE);
  });
});

describe('render arch footer', () => {
  it.each(ARCH_BODIES)('with layout %s on format %s, sets the footer under the includes within 40u', (layout, format) => {
    const { width, height } = FORMAT_SIZES[format];
    const u = Math.min(width, height) / BASE;

    const texts = drawn(layout, format);

    const heading = textOf(texts, 'Party pass includes');
    const lastInclude = textOf(texts, '2 drinks');
    const footer = textOf(texts, 'with Jimmy & Ismini');
    expect(footer?.x).toBeCloseTo(heading?.x ?? -1, -1);
    expect((footer?.y ?? Infinity) - (lastInclude?.bottom ?? 0)).toBeLessThanOrEqual(FOOTER_GAP_U * u);
  });
});
