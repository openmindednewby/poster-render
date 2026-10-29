import { FontSetId, FormatId, LayoutId, LineTieKind, render, sameSize, sameWidth, type FlierDoc } from './index';
import { docFor } from './testing/docs';
import { recordText, type DrawnText } from './testing/drawnText';
import { asPoster, fixtureImage, newCanvas } from './testing/fixture';

const assets = { dancers: fixtureImage() };
const MARGIN = 0.045;

function drawn(doc: FlierDoc): { texts: DrawnText[]; width: number; height: number } {
  const canvas = newCanvas();
  const texts = recordText(canvas, () => render(doc, assets, asPoster(canvas)));
  return { texts, width: canvas.width, height: canvas.height };
}

const pick = (texts: DrawnText[], text: string): DrawnText | undefined => texts.find((t) => t.text === text);

describe('sameWidth', () => {
  it.each([
    [LayoutId.PictureRight, FormatId.Story],
    [LayoutId.PictureBottom, FormatId.Story],
    [LayoutId.PictureRight, FormatId.Square],
  ])('with title and titleBottom on %s %s, draws both within 1px of one width', (layout, format) => {
    const doc = sameWidth(docFor(layout, format), 'title', 'titleBottom');

    const { texts } = drawn(doc);

    expect(Math.abs((pick(texts, 'KIZOMBA')?.width ?? 0) - (pick(texts, 'WORKSHOP')?.width ?? 99))).toBeLessThanOrEqual(1);
  });

  it('with venue.0 and venue.1, draws both within 1px of one width inside the margins', () => {
    const doc = sameWidth(docFor(LayoutId.PictureRight, FormatId.Story), 'venue.0', 'venue.1');

    const { texts, width, height } = drawn(doc);

    const lines = [pick(texts, 'Bailemos'), pick(texts, 'Dance School')];
    const m = Math.round(Math.min(width, height) * MARGIN);
    const inside = lines.every((t) => t !== undefined && t.x >= m - 1 && t.x + t.width <= width - m + 1);
    expect([Math.abs((lines[0]?.width ?? 0) - (lines[1]?.width ?? 99)) <= 1, inside]).toEqual([true, true]);
  });

  it('after a switch to the Modern font set, still draws title and titleBottom within 1px of one width', () => {
    const doc = sameWidth(docFor(LayoutId.PictureRight, FormatId.Story), 'title', 'titleBottom');

    const { texts } = drawn({ ...doc, fonts: FontSetId.Modern });

    expect(Math.abs((pick(texts, 'KIZOMBA')?.width ?? 0) - (pick(texts, 'WORKSHOP')?.width ?? 99))).toBeLessThanOrEqual(1);
  });

  it('called twice with the same pair, keeps one tie and leaves the input doc untouched', () => {
    const doc = docFor(LayoutId.PictureRight, FormatId.Story);

    const twice = sameWidth(sameWidth(doc, 'title', 'titleBottom'), 'titleBottom', 'title');

    expect([twice.lineTies, doc.lineTies]).toEqual([[{ kind: LineTieKind.Width, lines: ['title', 'titleBottom'] }], undefined]);
  });
});

describe('sameSize', () => {
  it('with script and titleBottom, draws both at one font size', () => {
    const doc = sameSize(docFor(LayoutId.PictureRight, FormatId.Story), 'script', 'titleBottom');

    const { texts } = drawn(doc);

    expect(pick(texts, 'Saturday 31 October')?.size).toBeCloseTo(pick(texts, 'WORKSHOP')?.size ?? 0, 3);
  });

  it('with venue.1 and footer in different groups, draws both at one font size', () => {
    const doc = sameSize(docFor(LayoutId.PictureBottom, FormatId.Story), 'venue.1', 'footer');

    const { texts } = drawn(doc);

    expect(pick(texts, 'Dance School')?.size).toBeCloseTo(pick(texts, 'with Jimmy & Ismini')?.size ?? 0, 3);
  });

  it('with the same line twice, returns the doc without a tie', () => {
    const doc = docFor(LayoutId.PictureRight, FormatId.Story);

    const tied = sameSize(doc, 'footer', 'footer');

    expect(tied.lineTies).toBeUndefined();
  });
});
