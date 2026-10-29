import { FontSetId, FormatId, LayoutId, render, validateFlierDoc } from '../index';
import { FONT_SETS } from '../fontSets';
import { bodyGroups } from '../layout/blockGroups';
import { PALETTES } from '../palettes';
import { docFor } from '../testing/docs';
import { asPoster, fixtureImage, newCanvas } from '../testing/fixture';
import type { FlierDoc, RenderReport, RowTheme } from '../types';

const assets = { dancers: fixtureImage(), logo: fixtureImage() };
const withRows = (rows: RowTheme): FlierDoc => ({ ...docFor(LayoutId.PictureRight, FormatId.Story), rows });
const draw = (doc: FlierDoc): RenderReport => render(doc, assets, asPoster(newCanvas()));

describe('render venue pinSize, pinGap and centred', () => {
  it('with a 90px pin, a 16px gap and centred, sets the pin 90px, the text 16px after it and centres the text on it', () => {
    const doc = withRows({ venue: { body: true, bare: true, oneLine: true, pinSize: 90, pinGap: 16, centred: true }, textWidth: 660 });

    const report = draw(doc);

    const pin = report.iconBoxes[0] ?? { x: 0, y: 0, w: 0, h: 0 };
    const text = report.textBoxes.find((t) => t.x > pin.x && Math.abs(t.y - pin.y) < pin.h) ?? { x: 0, y: 0, w: 0, h: 0 };
    expect([Math.round(pin.h), Math.round(text.x - pin.x - pin.w), Math.round(text.y + text.h / 2)]).toEqual([90, 16, Math.round(pin.y + pin.h / 2)]);
  });
});

describe('render venue pinShift', () => {
  it('with a pin shift of -8, draws the pin 8px higher than without it', () => {
    const venue = { body: true, bare: true, oneLine: true, pinSize: 90, pinGap: 16, centred: true };
    const before = draw(withRows({ venue, textWidth: 660 })).iconBoxes[0]?.y ?? 0;

    const after = draw(withRows({ venue: { ...venue, pinShift: -8 }, textWidth: 660 })).iconBoxes[0]?.y ?? 0;

    expect(Math.round(before - after)).toBe(8);
  });
});

describe('bodyGroups priceGap', () => {
  it('with a price gap of -17, sets -17 after each price amount line', () => {
    const doc = withRows({ priceGap: -17 });

    const groups = bodyGroups(doc, PALETTES[doc.palette], 1);

    const amounts = groups.flatMap((g) => g.lines).filter((l) => l.text === doc.blocks.prices?.[0]?.amount);
    expect(amounts.map((l) => l.gapAfter)).toEqual([-17]);
  });
});

describe('FONT_SETS kizomba sample', () => {
  it('with the sample set, uses Sofia for the script role (the date), Style Script next', () => {
    const script = FONT_SETS[FontSetId.KizombaSample].script;

    expect(script.startsWith('"Sofia", "Style Script"')).toBe(true);
  });
});

describe('validateFlierDoc round 3 fields', () => {
  it('with pin size, pin gap, centred and price gap, accepts the doc', () => {
    const doc = withRows({ venue: { pinSize: 90, pinGap: 16, centred: true }, priceGap: -17 });

    const result = validateFlierDoc(doc);

    expect(result.ok).toBe(true);
  });
});
