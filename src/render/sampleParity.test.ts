import { FormatId, LayoutId, render, validateFlierDoc } from '../index';
import { bodyGroups, headerGroups } from '../layout/blockGroups';
import { PALETTES } from '../palettes';
import { docFor } from '../testing/docs';
import { asPoster, fixtureImage, newCanvas } from '../testing/fixture';
import type { FlierDoc, PosterTuning, RenderReport, RowTheme } from '../types';

const assets = { dancers: fixtureImage(), logo: fixtureImage() };
const plain = (): FlierDoc => docFor(LayoutId.PictureRight, FormatId.Story);
const withRows = (rows: RowTheme): FlierDoc => ({ ...plain(), rows });
const withTuning = (tuning: PosterTuning): FlierDoc => ({ ...plain(), tuning });
const draw = (doc: FlierDoc): RenderReport => render(doc, assets, asPoster(newCanvas()));

describe('render dividers.lengths', () => {
  it('with stepped lengths, draws each rule at its own length and repeats the last one', () => {
    const doc = withRows({ dividers: { thickness: 5, lengths: [668, 572, 480] } });

    const widths = draw(doc).ruleBoxes.map((r) => Math.round(r.w));

    expect(widths.slice(0, 4)).toEqual([668, 572, 480, 480]);
  });
});

describe('render venue.oneLine', () => {
  it('with a two-line venue set on one line, draws one text box fewer', () => {
    const before = draw(withRows({ venue: { body: true } })).textBoxes.length;

    const after = draw(withRows({ venue: { body: true, oneLine: true }, textWidth: 660 })).textBoxes.length;

    expect(after).toBe(before - 1);
  });
});

describe('render tuning.headerTextWidth and bodyTop', () => {
  it('with a 670px header text width, draws the title wider than the default header zone', () => {
    const before = draw(plain()).textBoxes[0]?.w ?? 0;

    const after = draw(withTuning({ headerTextWidth: 670 })).textBoxes[0]?.w ?? 0;

    expect(after).toBeGreaterThan(before);
  });

  it('with a 600px header height over a 560px body top, draws the title taller than without it', () => {
    const before = draw(withTuning({ bodyTop: 560, scriptScale: 1.1 })).textBoxes[0]?.h ?? 0;

    const after = draw(withTuning({ bodyTop: 560, scriptScale: 1.1, headerHeight: 600 })).textBoxes[0]?.h ?? 0;

    expect(after).toBeGreaterThan(before);
  });

  it('with a body top of 668px, starts the first rule at 668px', () => {
    const doc = withTuning({ bodyTop: 668 });

    const first = draw(doc).ruleBoxes[0]?.y ?? 0;

    expect(Math.round(first)).toBe(668);
  });
});

describe('headerGroups', () => {
  it('with title spacing and a script scale, spaces both title lines and grows the script', () => {
    const doc = withTuning({ titleSpacing: -0.04, scriptScale: 1.1 });

    const lines = headerGroups(doc, PALETTES[doc.palette], 1)[0]?.lines ?? [];

    expect(lines.map((l) => [l.spacing, l.size])).toEqual([[-0.04, 250], [undefined, 132], [-0.04, 250]]);
  });
});

describe('bodyGroups', () => {
  it('with a label scale, time scale and time weight, ties the schedule labels at one size and sets the time weight', () => {
    const doc = withRows({ labelScale: 1.5, timeScale: 0.95, timeWeight: 500 });

    const rows = bodyGroups(doc, PALETTES[doc.palette], 1).slice(1, 3).map((g) => g.lines);

    expect(rows.map(([label, time]) => [label?.size, label?.sizeTie !== undefined, time?.size, time?.weight])).toEqual([[99, true, 57, 500], [99, true, 57, 500]]);
  });
});

describe('validateFlierDoc', () => {
  it('with the new row and tuning fields, accepts the doc', () => {
    const doc = { ...withRows({ dividers: { thickness: 5, lengths: [668, 366] }, labelScale: 1.1, timeScale: 0.95, timeWeight: 500, textWidth: 660, venue: { oneLine: true } }), tuning: { headerTextWidth: 670, bodyTop: 668, titleSpacing: -0.04, scriptScale: 1.1 } };

    const result = validateFlierDoc(doc);

    expect(result.ok).toBe(true);
  });

  it('with a negative divider length, rejects the doc', () => {
    const doc = withRows({ dividers: { thickness: 5, lengths: [-1] } });

    const result = validateFlierDoc(doc);

    expect(result.ok).toBe(false);
  });
});
