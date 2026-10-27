import { defaultLayoutFor, FormatId, LAYOUT_CATALOGUE, LayoutId } from './index';

describe('LAYOUT_CATALOGUE', () => {
  it('with every layout id, lists each exactly once', () => {
    const ids = LAYOUT_CATALOGUE.map((e) => e.id);

    const sorted = [...ids].sort();

    expect(sorted).toEqual([...Object.values(LayoutId)].sort());
  });

  it('with every entry, carries a label and at least one format', () => {
    const bad = LAYOUT_CATALOGUE.filter((e) => e.label.length === 0 || e.formats.length === 0);

    expect(bad).toEqual([]);
  });
});

describe('defaultLayoutFor', () => {
  it('with each format, returns the D4 top scorer: E-A for posters, P-A for phone, D-A for desktop', () => {
    const defaults = Object.values(FormatId).map((f) => defaultLayoutFor(f));

    expect(defaults).toEqual([LayoutId.PictureRight, LayoutId.PictureRight, LayoutId.PictureRight, LayoutId.PhoneClockSafe, LayoutId.DesktopSafe]);
  });

  it('with each format, returns a layout whose catalogue entry lists that format', () => {
    const misses = Object.values(FormatId).filter((f) => !LAYOUT_CATALOGUE.find((e) => e.id === defaultLayoutFor(f))?.formats.includes(f));

    expect(misses).toEqual([]);
  });
});
