import { LayoutId } from '../enums/LayoutId';
import type { LayoutGeometry } from '../layout/geometry';
import { flow, type FlowGroup, type FlowResult } from '../layout/textFlow';
import type { FontSet, PosterContext, Rect } from '../types';

const LINE_HEIGHT = 1.2;
const BODY_GAP = 40;
const BOTTOM_SIDE = 0.1;

function flowFlanks(ctx: PosterContext, groups: FlowGroup[], flanks: Rect[], fonts: FontSet): FlowResult[] {
  const half = Math.ceil(groups.length / 2);
  return flanks.map((zone, i) => (i === 0 ? flow(ctx, groups.slice(0, half), zone, fonts) : flow(ctx, groups.slice(half), { ...zone, right: true }, fonts)));
}

function smallestPerLine(groups: FlowGroup[], results: FlowResult[]): number[] {
  const sizes = results.flatMap((r) => r.texts.map((t) => t.box.h / LINE_HEIGHT));
  const smallest: number[] = [];
  let i = 0;
  groups.forEach((g) =>
    g.lines.forEach((_line, j) => {
      smallest[j] = Math.min(smallest[j] ?? Infinity, sizes[i] ?? Infinity);
      i++;
    }),
  );
  return smallest;
}

/** Flows the price groups into the flank zones, then sets each line role at one size across every flank. */
export function equalFlanks(ctx: PosterContext, groups: FlowGroup[], flanks: Rect[], fonts: FontSet): FlowResult[] {
  const smallest = smallestPerLine(groups, flowFlanks(ctx, groups, flanks, fonts));
  const sized = groups.map((g) => ({ ...g, lines: g.lines.map((line, j) => ({ ...line, size: Math.min(line.size, smallest[j] ?? line.size) })) }));
  return flowFlanks(ctx, sized, flanks, fonts);
}

function measuredEnd(f: FlowResult, fallback: number): number {
  const bottoms = [...f.texts.map((t) => t.box), ...f.rules.map((r) => r.rect), ...f.icons.map((i) => i.rect)].map((r) => r.y + r.h);
  return bottoms.length > 0 ? Math.max(...bottoms) : fallback;
}

/** The picture region; for picture-bottom it starts 40u under the body's measured end and runs to the frame edge. */
export function pictureRegion(layout: LayoutId, geo: LayoutGeometry, body: FlowResult, u: number, frame: { width: number; height: number }): Rect {
  if (layout !== LayoutId.PictureBottom) {
    return geo.picture;
  }
  const y = Math.ceil(measuredEnd(body, geo.body.y) + BODY_GAP * u);
  const x = Math.round(frame.width * BOTTOM_SIDE);
  return { x, y, w: frame.width - 2 * x, h: frame.height - y };
}
