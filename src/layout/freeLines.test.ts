import { FormatId } from '../enums/FormatId';
import { LayoutId } from '../enums/LayoutId';
import { validateFlierDoc } from '../index';
import { PALETTES } from '../palettes';
import { docFor } from '../testing/docs';
import type { FlierDoc } from '../types';
import { bodyGroups } from './blockGroups';

const withLines = (lines: string[], extra: Partial<FlierDoc> = {}): FlierDoc => {
  const doc = docFor(LayoutId.PictureRight, FormatId.Story);
  return { ...doc, ...extra, blocks: { ...doc.blocks, includes: { heading: 'Includes', items: ['2 drinks'] }, footer: 'with Jimmy', lines } };
};

const keysOf = (doc: FlierDoc): string[] => bodyGroups(doc, PALETTES[doc.palette], 1).flatMap((g) => g.lines.map((l) => l.key ?? ''));

const errorsOf = (doc: unknown): string[] => {
  const result = validateFlierDoc(doc);
  return result.ok ? [] : result.errors;
};

describe('bodyGroups free lines', () => {
  it('with two free lines, draws them in order after the includes and before the footer', () => {
    const doc = withLines(['Free parking', 'Bring a friend']);

    const keys = keysOf(doc);

    expect(keys.slice(keys.indexOf('includes.items.0') + 1)).toEqual(['lines.0', 'lines.1', 'footer']);
  });

  it('with a blank free line, skips it and keeps the index of the next line', () => {
    const doc = withLines(['', 'Bring a friend']);

    const keys = keysOf(doc);

    expect(keys.filter((k) => k.startsWith('lines.'))).toEqual(['lines.1']);
  });

  it('with a style on lines.1, draws that line with the styled size', () => {
    const plain = withLines(['Free parking', 'Bring a friend']);
    const styled = withLines(['Free parking', 'Bring a friend'], { lineStyles: { 'lines.1': { sizeScale: 2 } } });
    const sizeOf = (doc: FlierDoc): number => bodyGroups(doc, PALETTES[doc.palette], 1).flatMap((g) => g.lines).find((l) => l.key === 'lines.1')?.size ?? 0;

    const size = sizeOf(styled);

    expect(size).toBeCloseTo(sizeOf(plain) * 2, 5);
  });
});

describe('validateFlierDoc free lines', () => {
  it('with free lines, a blank line and a lines.5 style, accepts the doc', () => {
    const doc = withLines(['Free parking', '', 'c', 'd', 'e', 'f'], { lineStyles: { 'lines.5': { color: '#ff0000' } } });

    const errors = errorsOf(doc);

    expect(errors).toEqual([]);
  });

  it('with seven free lines, rejects the doc', () => {
    const doc = withLines(['a', 'b', 'c', 'd', 'e', 'f', 'g']);

    const errors = errorsOf(doc);

    expect(errors.length).toBeGreaterThan(0);
  });
});
