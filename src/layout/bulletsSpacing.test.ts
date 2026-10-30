import { createCanvas } from '@napi-rs/canvas';
import { FONT_SETS } from '../fontSets';
import { FontSetId } from '../enums/FontSetId';
import { FormatId } from '../enums/FormatId';
import { LayoutId } from '../enums/LayoutId';
import { PALETTES } from '../palettes';
import { docFor } from '../testing/docs';
import type { FlierDoc, PosterContext } from '../types';
import { bodyGroups } from './blockGroups';
import { flow, type FlowLine } from './textFlow';

const includesDoc = (extra: Partial<FlierDoc>): FlierDoc => {
  const doc = docFor(LayoutId.PictureRight, FormatId.Story);
  return { ...doc, ...extra, blocks: { ...doc.blocks, includes: { heading: 'Includes', items: ['2 drinks', 'Kizomba room'] }, footer: 'with Jimmy' } };
};

const bulletsOf = (doc: FlierDoc): (string | undefined)[] => bodyGroups(doc, PALETTES[doc.palette], 1).flatMap((g) => g.lines.filter((l) => l.key?.startsWith('includes.items') === true).map((l) => l.bullet));

describe('bodyGroups bullets', () => {
  it('with bullets unset, gives every includes item a bullet', () => {
    const doc = includesDoc({});

    const bullets = bulletsOf(doc);

    expect(bullets.every((b) => b !== undefined)).toBe(true);
  });

  it('with bullets false, gives no includes item a bullet', () => {
    const doc = includesDoc({ bullets: false });

    const bullets = bulletsOf(doc);

    expect(bullets).toEqual([undefined, undefined]);
  });
});

describe('bodyGroups footer lines', () => {
  it('with a footer holding a line break, sets one footer line per text line', () => {
    const base = includesDoc({});
    const doc = { ...base, blocks: { ...base.blocks, footer: 'with Jimmy & Ismini\nwww.bailemos.cy' } };

    const groups = bodyGroups(doc, PALETTES[doc.palette], 1);

    const footer = groups.flatMap((g) => g.lines).filter((l) => l.key === 'footer');
    expect(footer.map((l) => l.text)).toEqual(['with Jimmy & Ismini', 'www.bailemos.cy']);
  });
});

describe('flow line spacing', () => {
  const line = (text: string, extra: Partial<FlowLine> = {}): FlowLine => ({ text, role: 'body', weight: 600, size: 40, color: '#000000', ...extra });
  const yOfSecond = (second: FlowLine): number => {
    const ctx = createCanvas(10, 10).getContext('2d') as unknown as PosterContext;
    const out = flow(ctx, [{ lines: [line('first'), second], gapAfter: 0 }], { x: 0, y: 0, w: 400, h: 4000 }, FONT_SETS[FontSetId.Classic]);
    return out.texts[1]?.box.y ?? 0;
  };

  it('with spaceAbove on a line, moves that line down by the space', () => {
    const plain = yOfSecond(line('second'));

    const spaced = yOfSecond(line('second', { spaceAbove: 20 }));

    expect(spaced).toBeCloseTo(plain + 20, 0);
  });

  it('with spaceBelow on the first line, moves the next line down by the space', () => {
    const ctx = createCanvas(10, 10).getContext('2d') as unknown as PosterContext;
    const plain = flow(ctx, [{ lines: [line('first'), line('second')], gapAfter: 0 }], { x: 0, y: 0, w: 400, h: 4000 }, FONT_SETS[FontSetId.Classic]);

    const spaced = flow(ctx, [{ lines: [line('first', { spaceBelow: 20 }), line('second')], gapAfter: 0 }], { x: 0, y: 0, w: 400, h: 4000 }, FONT_SETS[FontSetId.Classic]);

    expect(spaced.texts[1]?.box.y ?? 0).toBeCloseTo((plain.texts[1]?.box.y ?? 0) + 20, 0);
  });
});
