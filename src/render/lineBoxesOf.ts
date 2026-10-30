import type { TextOp } from '../layout/textFlow';
import type { LineKey, Rect } from '../types';

function union(a: Rect | undefined, b: Rect): Rect {
  if (a === undefined) {
    return { ...b };
  }
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

/** The box of every keyed line: the union of its text boxes, or of its own runs when a line carries two keys. */
export function lineBoxesOf(texts: readonly TextOp[]): Record<LineKey, Rect | undefined> {
  const boxes: Record<LineKey, Rect | undefined> = {};
  texts.forEach(({ key, box, runs }) => {
    (runs ?? (key === undefined ? [] : [{ key, box }])).forEach((r) => {
      boxes[r.key] = union(boxes[r.key], r.box);
    });
  });
  return boxes;
}
