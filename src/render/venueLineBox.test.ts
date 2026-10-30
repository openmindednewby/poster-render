import { BodySection, render, type FlierDoc } from '../index';
import { COMBOS, docFor, sampleDoc } from '../testing/docs';
import { kizombaWorkshopDocs } from '../examples/kizombaWorkshop';
import { asPoster, fixtureImage, newCanvas } from '../testing/fixture';

const assets = { dancers: fixtureImage(), logo: fixtureImage() };
const EDGE = 0.5;
const REORDERED = [BodySection.Schedule, BodySection.Venue, BodySection.Prices, BodySection.Includes, BodySection.Footer];

interface Drawn {
  text: string;
  y: number;
}

function venueMisses(doc: FlierDoc): string[] {
  const canvas = newCanvas();
  const drawn: Drawn[] = [];
  const ctx = canvas.getContext('2d');
  const original = ctx.fillText.bind(ctx);
  jest.spyOn(ctx, 'fillText').mockImplementation((text: string, x: number, y: number) => {
    drawn.push({ text, y });
    original(text, x, y);
  });
  const report = render(doc, { ...assets }, asPoster(canvas));
  return Object.entries(report.lineBoxes)
    .filter(([key]) => key.startsWith('venue.'))
    .filter(([key, box]) => {
      const lines = doc.blocks.venue ?? [];
      const text = doc.rows?.venue?.oneLine === true ? lines.join(' ') : lines[Number(key.split('.')[1])];
      return !drawn.some((d) => d.text === text && box !== undefined && Math.abs(d.y - box.y) <= EDGE);
    })
    .map(([key]) => `${doc.layout}/${doc.format}/${key}`);
}

describe('render lineBoxes venue', () => {
  it('with every layout and format, puts each venue box where its venue text is drawn', () => {
    const docs = COMBOS.map(([layout, format]) => docFor(layout, format));

    const misses = docs.flatMap(venueMisses);

    expect(misses).toEqual([]);
  });

  it('with the kizomba workshop docs, with and without a sectionOrder, puts each venue box where its venue text is drawn', () => {
    const docs = kizombaWorkshopDocs.flatMap((d) => [d, { ...d, sectionOrder: REORDERED }]);

    const misses = docs.flatMap(venueMisses);

    expect(misses).toEqual([]);
  });

  it('with each venue look (centred, one line, body, big pin) on the kizomba docs, puts each venue box where its venue text is drawn', () => {
    const looks = [{ centred: true }, { oneLine: true }, { body: true }, { pinSize: 60, centred: true }];
    const docs = kizombaWorkshopDocs.flatMap((d) => looks.map((venue) => ({ ...d, rows: { ...d.rows, venue: { ...d.rows?.venue, ...venue } } })));

    const misses = docs.flatMap(venueMisses);

    expect(misses).toEqual([]);
  });

  it('with the sample doc and a sectionOrder set, puts each venue box where its venue text is drawn', () => {
    const docs = [sampleDoc(), { ...sampleDoc(), sectionOrder: REORDERED }];

    const misses = docs.flatMap(venueMisses);

    expect(misses).toEqual([]);
  });
});
