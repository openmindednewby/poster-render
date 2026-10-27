import { FlierDocError, FormatId, kizombaWorkshopDocs, LayoutId, render, validateFlierDoc } from '../index';
import { docFor } from '../testing/docs';
import { asPoster, fixtureImage, newCanvas, pixels } from '../testing/fixture';

type Mutate = (d: Record<string, unknown> & { blocks: Record<string, unknown> }) => void;

const nineItems = Array.from({ length: 9 }, () => ({ date: 'Sat', schedule: [{ label: 'L', time: 'T' }] }));

const CASES: [string, Mutate, string][] = [
  ['a missing title', (d) => { delete d.blocks.title; }, 'blocks.title: is required'],
  ['an unknown layout', (d) => { d.layout = 'diagonal'; }, 'layout: must be one of picture-right, picture-left, picture-bottom, list, arch, phone-clock-safe, phone-arch, desktop-safe, desktop-arch (got "diagonal")'],
  ['a number as title', (d) => { d.blocks.title = 42; }, 'blocks.title: must be a string (got number)'],
  ['an extra property', (d) => { d.colour = 'red'; }, 'colour: is not allowed'],
  ['an empty schedule time', (d) => { d.blocks.schedule = [{ label: 'Level 1', time: '' }]; }, 'blocks.schedule[0].time: must not be empty'],
  ['a picture scale of 3', (d) => { d.picture = { imageId: 'dancers', anchor: 'bottom', scale: 3 }; }, 'picture.scale: must be at most 1 (got 3)'],
  ['a wrong version', (d) => { d.version = 2; }, 'version: must be 1 (got 2)'],
  ['a list layout with no items', (d) => { d.layout = 'list'; delete d.items; }, 'items: layout "list" needs at least one item'],
  ['nine list items', (d) => { d.items = nineItems; }, 'items: must have at most 8 entries (got 9)'],
];

const mutated = (m: Mutate): unknown => {
  const doc = JSON.parse(JSON.stringify(docFor(LayoutId.PictureRight, FormatId.Story)));
  m(doc);
  return doc;
};

describe('validateFlierDoc AC-05 schema gate', () => {
  it.each(CASES)('with %s, rejects the doc with a readable message', (_name, m, message) => {
    const doc = mutated(m);

    const result = validateFlierDoc(doc);

    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.errors).toContain(message);
  });

  it.each([['null', null], ['a string', 'flier'], ['an array', []]])('with %s as the doc, rejects it as not an object', (_name, input) => {
    const result = validateFlierDoc(input);

    expect(result.ok ? [] : result.errors).toEqual(['doc: must be an object']);
  });

  it('with every built-in kizomba workshop doc, accepts it', () => {
    const results = kizombaWorkshopDocs.map((d) => validateFlierDoc(d));

    expect(results.map((r) => (r.ok ? 'ok' : r.errors.join()))).toEqual(['ok', 'ok', 'ok', 'ok']);
  });
});

describe('render AC-05 never half-renders', () => {
  it.each(CASES)('with %s, throws FlierDocError and leaves the canvas untouched', (_name, m) => {
    const canvas = newCanvas();

    const act = (): unknown => render(mutated(m), { dancers: fixtureImage() }, asPoster(canvas));

    expect(act).toThrow(FlierDocError);
    expect([canvas.width, canvas.height, Array.from(pixels(canvas))]).toEqual([1, 1, [0, 0, 0, 0]]);
  });

  it('with a picture id missing from the assets, throws FlierDocError naming it and leaves the canvas untouched', () => {
    const canvas = newCanvas();

    const act = (): unknown => render(docFor(LayoutId.PictureLeft, FormatId.Post), {}, asPoster(canvas));

    expect(act).toThrow('picture.imageId: no asset named "dancers"');
    expect(canvas.width).toBe(1);
  });
});
