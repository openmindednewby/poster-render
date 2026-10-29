import { createHash } from 'node:crypto';
import { FormatId, LayoutId, render } from '../index';
import { docFor } from '../testing/docs';
import { asPoster, fixtureImage, newCanvas, pixels } from '../testing/fixture';
import type { FlierDoc, PosterTuning, RenderReport } from '../types';

const assets = { dancers: fixtureImage() };
const plain = (): FlierDoc => docFor(LayoutId.PictureRight, FormatId.Story);
const withTuning = (tuning: PosterTuning): FlierDoc => ({ ...plain(), tuning });
const draw = (doc: FlierDoc): RenderReport => render(doc, assets, asPoster(newCanvas()));

function hashOf(doc: FlierDoc): string {
  const canvas = newCanvas();
  render(doc, assets, asPoster(canvas));
  return createHash('sha256').update(pixels(canvas)).digest('hex');
}

const gapBelow = (report: RenderReport, i: number): number => {
  const upper = report.textBoxes[i];
  const lower = report.textBoxes[i + 1];
  return upper && lower ? lower.y - (upper.y + upper.h) : NaN;
};

describe('render header gaps', () => {
  it('with a title-to-script gap, opens space between the title and the script line', () => {
    const doc = withTuning({ titleScriptGap: 40 });

    const report = draw(doc);

    expect(gapBelow(report, 0)).toBeGreaterThan(gapBelow(draw(plain()), 0));
  });

  it('with a script-to-title gap, opens space between the script line and the bottom title', () => {
    const doc = withTuning({ scriptTitleGap: 40 });

    const report = draw(doc);

    expect(gapBelow(report, 1)).toBeGreaterThan(gapBelow(draw(plain()), 1));
  });

  it('with a header top of 113px, starts the title at 113px or lower', () => {
    const doc = withTuning({ headerTop: 113 });

    const report = draw(doc);

    expect(report.textBoxes[0]?.y).toBeGreaterThanOrEqual(113);
  });
});

describe('render title scales', () => {
  it('with a title scale of 0.5, draws the top title smaller than without it', () => {
    const doc = withTuning({ titleScale: 0.5 });

    const report = draw(doc);

    expect(report.textBoxes[0]?.h).toBeLessThan(draw(plain()).textBoxes[0]?.h ?? 0);
  });

  it('with a bottom title scale of 0.5, draws the bottom title smaller than without it', () => {
    const doc = withTuning({ titleBottomScale: 0.5 });

    const report = draw(doc);

    expect(report.textBoxes[2]?.h).toBeLessThan(draw(plain()).textBoxes[2]?.h ?? 0);
  });
});

describe('render without sample options', () => {
  it('with empty tuning and empty rows, draws the same pixels as without them', () => {
    const doc = { ...plain(), tuning: {}, rows: {} };

    const hash = hashOf(doc);

    expect(hash).toBe(hashOf(plain()));
  });
});
