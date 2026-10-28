import { FormatId, LayoutId, render, validateFlierDoc } from '../index';
import { docFor } from '../testing/docs';
import { recordText } from '../testing/drawnText';
import { asPoster, fixtureImage, newCanvas, pixels } from '../testing/fixture';

const assets = { dancers: fixtureImage() };

function drawn(doc: ReturnType<typeof docFor>): ReturnType<typeof recordText> {
  const canvas = newCanvas();
  return recordText(canvas, () => render(doc, assets, asPoster(canvas)));
}

describe('render tuning', () => {
  it('with a header gap of 56, starts the venue rule 56px under the last header line', () => {
    const doc = { ...docFor(LayoutId.PictureRight, FormatId.Story), tuning: { headerGap: 56 } };
    const ruleAndGap = 56 + 20;

    const texts = drawn(doc);

    const workshop = texts.find((t) => t.text === 'WORKSHOP');
    const venue = texts.find((t) => t.text === 'Bailemos');
    expect(Math.round((venue?.y ?? 0) - (workshop?.bottom ?? 0))).toBeLessThanOrEqual(ruleAndGap + 1);
  });

  it('with no header gap, keeps the venue where the layout puts it', () => {
    const plain = drawn(docFor(LayoutId.PictureRight, FormatId.Story));

    const tuned = drawn({ ...docFor(LayoutId.PictureRight, FormatId.Story), tuning: {} });

    expect(tuned.map((t) => [t.text, t.y, t.size])).toEqual(plain.map((t) => [t.text, t.y, t.size]));
  });

  it('with an item date scale of 1.15, sets the list dates 15% larger', () => {
    const list = docFor(LayoutId.List, FormatId.Story);
    const plain = drawn(list).find((t) => t.text === 'Sat 31 Oct');

    const tuned = drawn({ ...list, tuning: { itemDateScale: 1.15 } }).find((t) => t.text === 'Sat 31 Oct');

    expect((tuned?.size ?? 0) / (plain?.size ?? 1)).toBeCloseTo(1.15, 1);
  });

  it('with an empty tuning, draws the same pixels as without one', () => {
    const a = newCanvas();
    const b = newCanvas();
    render(docFor(LayoutId.List, FormatId.Story), assets, asPoster(a));

    render({ ...docFor(LayoutId.List, FormatId.Story), tuning: {} }, assets, asPoster(b));

    expect(Buffer.compare(Buffer.from(pixels(a)), Buffer.from(pixels(b)))).toBe(0);
  });

  it('with an unknown tuning key or a gap over 200, fails the schema', () => {
    const base = docFor(LayoutId.List, FormatId.Story);

    const errors = [validateFlierDoc({ ...base, tuning: { spin: 1 } }), validateFlierDoc({ ...base, tuning: { headerGap: 201 } })];

    expect(errors.map((r) => r.ok)).toEqual([false, false]);
  });
});
