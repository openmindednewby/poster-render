import { createCanvas } from '@napi-rs/canvas';
import { FONT_SETS } from '../fontSets';
import { FontSetId } from '../enums/FontSetId';
import { lineBoxesOf } from '../render/lineBoxesOf';
import type { PosterContext } from '../types';
import { flow, type FlowLine } from './textFlow';

const ctx = (): PosterContext => createCanvas(10, 10).getContext('2d') as unknown as PosterContext;
const AMOUNT = 'prices.0.amount';
const LABEL = 'prices.0.label';
const split: FlowLine = { text: '20€ Party pass', role: 'body', weight: 700, size: 40, color: '#000000', key: AMOUNT, tail: { key: LABEL, at: 4 } };

describe('lineBoxesOf', () => {
  it('with a line split into amount and label runs, boxes the amount and the label apart on the same row', () => {
    const out = flow(ctx(), [{ lines: [split], gapAfter: 0 }], { x: 0, y: 0, w: 1000, h: 1000 }, FONT_SETS[FontSetId.Classic]);

    const boxes = lineBoxesOf(out.texts);

    const amount = boxes[AMOUNT];
    const label = boxes[LABEL];
    expect(amount?.y).toBe(label?.y);
    expect((amount?.x ?? 0) + (amount?.w ?? 0)).toBeLessThan(label?.x ?? 0);
    expect((amount?.w ?? 0) + (label?.w ?? 0)).toBeLessThan(out.texts[0]?.box.w ?? 0);
  });

  it('with a line that has no runs, boxes the whole line under its key', () => {
    const out = flow(ctx(), [{ lines: [{ ...split, tail: undefined }], gapAfter: 0 }], { x: 0, y: 0, w: 1000, h: 1000 }, FONT_SETS[FontSetId.Classic]);

    const boxes = lineBoxesOf(out.texts);

    expect(boxes[AMOUNT]).toEqual(out.texts[0]?.box);
    expect(boxes[LABEL]).toBeUndefined();
  });
});
