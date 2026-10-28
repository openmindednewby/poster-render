import { FlierDocError, FormatId, kizombaWorkshopDocs, LayoutId, render, validateFlierDoc } from '../index';
import { docFor } from '../testing/docs';
import { asPoster, fixtureImage, newCanvas, pixels } from '../testing/fixture';

type Mutate = (d: Record<string, unknown> & { blocks: Record<string, unknown> }) => void;

const nineItems = Array.from({ length: 9 }, () => ({ date: 'Sat', schedule: [{ label: 'L', time: 'T' }] }));

const CASES: [string, Mutate, string][] = [
  ['a missing title', (d): void => { delete d.blocks.title; }, 'blocks.title: is required'],
  ['an unknown layout', (d): void => { d.layout = 'diagonal'; }, 'layout: must be one of picture-right, picture-left, picture-bottom, list, arch, phone-clock-safe, phone-arch, desktop-safe, desktop-arch (got "diagonal")'],
  ['a number as title', (d): void => { d.blocks.title = 42; }, 'blocks.title: must be a string (got number)'],
  ['an extra property', (d): void => { d.colour = 'red'; }, 'colour: is not allowed'],
  ['an empty schedule time', (d): void => { d.blocks.schedule = [{ label: 'Level 1', time: '' }]; }, 'blocks.schedule[0].time: must not be empty'],
  ['a picture scale of 3', (d): void => { d.picture = { imageId: 'dancers', anchor: 'bottom', scale: 3 }; }, 'picture.scale: must be at most 1 (got 3)'],
  ['a wrong version', (d): void => { d.version = 2; }, 'version: must be 1 (got 2)'],
  ['a list layout with no items', (d): void => { d.layout = 'list'; delete d.items; }, 'items: layout "list" needs at least one item'],
  ['nine list items', (d): void => { d.items = nineItems; }, 'items: must have at most 8 entries (got 9)'],
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
    const allOk = kizombaWorkshopDocs.map(() => 'ok');

    const results = kizombaWorkshopDocs.map((d) => validateFlierDoc(d));

    expect(results.map((r) => (r.ok ? 'ok' : r.errors.join()))).toEqual(allOk);
  });
});

describe('render AC-05 never half-renders', () => {
  it.each(CASES)('with %s, throws FlierDocError and leaves the canvas untouched', (_name, m) => {
    const canvas = newCanvas();
    const before = [canvas.width, canvas.height, Array.from(pixels(canvas))];

    const act = (): unknown => render(mutated(m), { dancers: fixtureImage() }, asPoster(canvas));

    expect(act).toThrow(FlierDocError);
    expect([canvas.width, canvas.height, Array.from(pixels(canvas))]).toEqual(before);
  });

  it('with a picture id missing from the assets, throws FlierDocError naming it and leaves the canvas untouched', () => {
    const canvas = newCanvas();
    const doc = docFor(LayoutId.PictureLeft, FormatId.Post);
    const widthBefore = canvas.width;
    const message = `picture.imageId: no asset named "${doc.picture?.imageId ?? ''}"`;

    const act = (): unknown => render(doc, {}, asPoster(canvas));

    expect(act).toThrow(message);
    expect(canvas.width).toBe(widthBefore);
  });
});
