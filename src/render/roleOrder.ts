import type { LineKey, Rect } from '../types';

const INDEX = /^\d+$/;

/** The role of a line key: the key without its list indices, so "schedule.0.label" is "schedule.label". */
export const roleOf = (key: LineKey): string => key.split('.').filter((part) => !INDEX.test(part)).join('.');

/** Every drawn role once, ordered by the top of its first line, then left to right. */
export function roleOrder(boxes: Record<LineKey, Rect | undefined>): string[] {
  const first = new Map<string, Rect>();
  Object.entries(boxes).forEach(([key, box]) => {
    const role = roleOf(key);
    const seen = first.get(role);
    if (box !== undefined && (seen === undefined || box.y < seen.y || (box.y === seen.y && box.x < seen.x))) {
      first.set(role, box);
    }
  });
  return [...first.entries()].sort(([, a], [, b]) => a.y - b.y || a.x - b.x).map(([role]) => role);
}
