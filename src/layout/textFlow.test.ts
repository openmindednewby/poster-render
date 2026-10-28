import { createCanvas } from '@napi-rs/canvas';
import { FONT_SETS } from '../fontSets';
import { FontSetId } from '../enums/FontSetId';
import type { PosterContext } from '../types';
import { flow, type FlowLine } from './textFlow';

const line = (text: string): FlowLine => ({ text, role: 'body', weight: 600, size: 40, color: '#000000' });

describe('flow', () => {
  it('with a uniform group whose longest line is too wide, sets every line of the block at one size', () => {
    const ctx = createCanvas(10, 10).getContext('2d') as unknown as PosterContext;
    const group = { lines: [line('Party pass includes'), line('2 drinks'), line('Salsa & Bachata room and the Kizomba dedicated room')], gapAfter: 0, uniform: true };

    const out = flow(ctx, [group], { x: 0, y: 0, w: 300, h: 1000 }, FONT_SETS[FontSetId.Classic]);

    expect(new Set(out.texts.map((t) => t.box.h)).size).toBe(1);
  });

  it('with a right-aligned zone, ends every line on the zone right edge', () => {
    const ctx = createCanvas(10, 10).getContext('2d') as unknown as PosterContext;

    const out = flow(ctx, [{ lines: [line('5€'), line('per hour')], gapAfter: 0 }], { x: 100, y: 0, w: 400, h: 1000, right: true }, FONT_SETS[FontSetId.Classic]);

    expect(out.texts.map((t) => Math.round(t.box.x + t.box.w))).toEqual([500, 500]);
  });

  it('with a wide zone whose balanced cut falls inside a keep-together run, sets the run in one column', () => {
    const ctx = createCanvas(10, 10).getContext('2d') as unknown as PosterContext;
    const groups = [{ lines: [line('Level 1')], gapAfter: 0 }, { lines: [line('5€')], gapAfter: 0, keepWithNext: true }, { lines: [line('20€')], gapAfter: 0 }, { lines: [line('footer')], gapAfter: 0 }];

    const out = flow(ctx, groups, { x: 0, y: 0, w: 1000, h: 200 }, FONT_SETS[FontSetId.Classic]);

    const xOf = (text: string): number | undefined => out.texts.find((t) => t.text === text)?.box.x;
    expect(xOf('5€')).toBe(xOf('20€'));
  });
});

describe('flow rule below', () => {
  it('with a group flagged ruleBelow, draws a second rule under its last line', () => {
    const ctx = createCanvas(10, 10).getContext('2d') as unknown as PosterContext;
    const group = { lines: [line('Bailemos')], gapAfter: 0, rule: { color: '#000000', height: 8 }, ruleBelow: true };

    const out = flow(ctx, [group], { x: 0, y: 0, w: 400, h: 1000 }, FONT_SETS[FontSetId.Classic]);

    expect(out.rules).toHaveLength(2);
    expect(out.rules[1]?.rect.y).toBeGreaterThan(out.texts[0]?.box.y ?? 0);
  });
});
