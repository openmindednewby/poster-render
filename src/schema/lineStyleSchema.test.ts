import { FormatId, LayoutId, LineAlign, LineTieKind, validateFlierDoc } from '../index';
import { docFor } from '../testing/docs';

const base = docFor(LayoutId.PictureRight, FormatId.Story);

const errorsOf = (extra: Record<string, unknown>): string[] => {
  const result = validateFlierDoc({ ...base, ...extra });
  return result.ok ? [] : result.errors;
};

describe('validateFlierDoc lineStyles and lineTies', () => {
  it('with every style field and a width tie set to valid values, accepts the doc', () => {
    const lineStyles = { footer: { font: 'Georgia', sizeScale: 1.2, color: '#a1B2c3', weight: 700, italic: true, letterSpacing: 0.05, align: LineAlign.Center }, 'schedule.1.time': { sizeScale: 0.8 } };
    const lineTies = [{ kind: LineTieKind.Width, lines: ['title', 'titleBottom'] }];

    const errors = errorsOf({ lineStyles, lineTies });

    expect(errors).toEqual([]);
  });

  it.each([
    [{ subtitle: { color: '#ffffff' } }, 'lineStyles.subtitle: is not allowed'],
    [{ footer: { color: 'red' } }, 'lineStyles.footer.color: has an invalid format'],
    [{ footer: { font: 'Arial; x' } }, 'lineStyles.footer.font: has an invalid format'],
    [{ footer: { sizeScale: -1 } }, 'lineStyles.footer.sizeScale: must be at least 0 (got -1)'],
    [{ footer: { weight: 950 } }, 'lineStyles.footer.weight: must be one of 100, 200, 300, 400, 500, 600, 700, 800, 900 (got 950)'],
    [{ footer: { italic: 'yes' } }, 'lineStyles.footer.italic: must be a boolean (got string)'],
    [{ footer: { letterSpacing: 1 } }, 'lineStyles.footer.letterSpacing: must be at most 0.5 (got 1)'],
    [{ footer: { align: 'justify' } }, 'lineStyles.footer.align: must be one of left, center, right (got "justify")'],
    [{ footer: { shadow: 2 } }, 'lineStyles.footer.shadow: is not allowed'],
    [{ 'venue.3': {} }, 'lineStyles.venue.3: is not allowed'],
  ])('with lineStyles %j, reports %s', (lineStyles, message) => {
    const errors = errorsOf({ lineStyles });

    expect(errors).toContain(message);
  });

  it('with an own __proto__ key inside lineStyles, rejects it as not allowed', () => {
    const input: unknown = JSON.parse(JSON.stringify({ ...base, lineStyles: {} }).replace('"lineStyles":{', '"lineStyles":{"__proto__":{"color":"#000000"}'));

    const result = validateFlierDoc(input);

    expect(result.ok ? [] : result.errors).toContain('lineStyles.__proto__: is not allowed');
  });

  it.each([
    [[{ kind: 'height', lines: ['title', 'script'] }], 'lineTies[0].kind: must be one of width, size (got "height")'],
    [[{ kind: LineTieKind.Size, lines: ['title'] }], 'lineTies[0].lines: must have at least 2 entries (got 1)'],
    [[{ kind: LineTieKind.Size, lines: ['title', 'body'] }], 'lineTies[0].lines[1]: has an invalid format'],
    [[{ kind: LineTieKind.Size, lines: ['footer', 'footer'] }], 'lineTies[0].lines: must name two different lines'],
  ])('with lineTies %j, reports %s', (lineTies, message) => {
    const errors = errorsOf({ lineTies });

    expect(errors).toContain(message);
  });
});
