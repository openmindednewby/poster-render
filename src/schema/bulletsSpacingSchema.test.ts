import { FormatId, LayoutId, validateFlierDoc } from '../index';
import { docFor } from '../testing/docs';

const base = docFor(LayoutId.PictureRight, FormatId.Story);

const errorsOf = (extra: Record<string, unknown>): string[] => {
  const result = validateFlierDoc({ ...base, ...extra });
  return result.ok ? [] : result.errors;
};

describe('validateFlierDoc bullets and line spacing', () => {
  it('with bullets false and spaceAbove/spaceBelow in range, accepts the doc', () => {
    const extra = { bullets: false, lineStyles: { footer: { spaceAbove: 0.5, spaceBelow: 1 } } };

    const errors = errorsOf(extra);

    expect(errors).toEqual([]);
  });

  it.each([
    [{ bullets: 'no' }, 'bullets: must be a boolean (got string)'],
    [{ lineStyles: { footer: { spaceAbove: 3 } } }, 'lineStyles.footer.spaceAbove: must be at most 2 (got 3)'],
    [{ lineStyles: { footer: { spaceBelow: -1 } } }, 'lineStyles.footer.spaceBelow: must be at least 0 (got -1)'],
  ])('with %j, reports %s', (extra, message) => {
    const errors = errorsOf(extra);

    expect(errors).toContain(message);
  });

  it('with a two-line footer, accepts the doc', () => {
    const extra = { blocks: { ...base.blocks, footer: 'with Jimmy & Ismini\nwww.bailemos.cy' } };

    const errors = errorsOf(extra);

    expect(errors).toEqual([]);
  });
});
