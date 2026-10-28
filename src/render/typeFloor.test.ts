import { kizombaWorkshop } from '../examples/kizombaWorkshop';
import { FORMAT_SIZES } from '../formats';
import { render } from '../index';
import { COMBOS } from '../testing/docs';
import { recordText } from '../testing/drawnText';
import { asPoster, fixtureImage, newCanvas, tallImage } from '../testing/fixture';
import type { FlierDoc } from '../types';
import type { FormatId } from '../enums/FormatId';
import type { LayoutId } from '../enums/LayoutId';

const FLOOR_PX = 30;
const BASE = 1080;
const ROUNDING = 0.01;

const floorFor = (format: FormatId): number => (FLOOR_PX * Math.min(FORMAT_SIZES[format].width, FORMAT_SIZES[format].height)) / BASE;

function smallestRun(layout: LayoutId, format: FormatId): number {
  const doc: FlierDoc = { ...kizombaWorkshop, layout, format };
  const canvas = newCanvas();
  const texts = recordText(canvas, () => {
    render(doc, { dancers: tallImage(), logo: fixtureImage() }, asPoster(canvas));
  });
  return Math.min(...texts.map((t) => t.size));
}

describe('render type floor', () => {
  it.each(COMBOS)('with the kizomba workshop on layout %s and format %s, draws no text run below 30px at story scale', (layout, format) => {
    const floor = floorFor(format);

    const smallest = smallestRun(layout, format);

    expect(smallest).toBeGreaterThanOrEqual(floor - ROUNDING);
  });
});
