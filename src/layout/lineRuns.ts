import type { FontSet, PosterContext, Rect } from '../types';
import { fontOf, type FlowLine } from './textFlow';

const NO_SPACING = '0px';

export type RunCut = readonly [number, number];

function widthOf(ctx: PosterContext, line: FlowLine, fonts: FontSet, text: string): number {
  ctx.font = fontOf(line, line.size, fonts);
  if (line.spacing === undefined) {
    return ctx.measureText(text).width;
  }
  ctx.letterSpacing = `${line.spacing * line.size}px`;
  const width = ctx.measureText(text).width;
  ctx.letterSpacing = NO_SPACING;
  return width;
}

/** The drawn width of a line at its own size. */
export const measure = (ctx: PosterContext, line: FlowLine, fonts: FontSet): number => widthOf(ctx, line, fonts, line.text);

/** Where the head run ends and the tail run starts, at the line's own size; undefined when the line has one key. */
export function measureCut(ctx: PosterContext, line: FlowLine, fonts: FontSet): RunCut | undefined {
  if (line.tail === undefined) {
    return undefined;
  }
  const head = line.text.slice(0, line.tail.at);
  return [widthOf(ctx, line, fonts, head.trimEnd()), widthOf(ctx, line, fonts, head)];
}

/** The head and tail run boxes of a two-key line, scaled to its drawn size. */
export function runsOf(line: FlowLine, box: Rect, cut: RunCut | undefined, scale: number): { runs?: { key: string; box: Rect }[] } {
  if (line.tail === undefined || line.key === undefined || cut === undefined) {
    return {};
  }
  const start = cut[1] * scale;
  return { runs: [{ key: line.key, box: { ...box, w: cut[0] * scale } }, { key: line.tail.key, box: { ...box, x: box.x + start, w: Math.max(0, box.w - start) } }] };
}
