import { LineTieKind } from './enums/LineTieKind';
import type { FlierDoc, LineKey } from './types';

function tie(doc: FlierDoc, kind: LineTieKind, a: LineKey, b: LineKey): FlierDoc {
  const ties = doc.lineTies ?? [];
  const exists = ties.some((t) => t.kind === kind && t.lines.includes(a) && t.lines.includes(b));
  if (a === b || exists) {
    return doc;
  }
  return { ...doc, lineTies: [...ties, { kind, lines: [a, b] }] };
}

/** Returns a copy of the doc whose lines a and b draw at one width (within 1px), grown to the wider inside the margins. */
export const sameWidth = (doc: FlierDoc, a: LineKey, b: LineKey): FlierDoc => tie(doc, LineTieKind.Width, a, b);

/** Returns a copy of the doc whose lines a and b take one font size, the larger one where it fits. */
export const sameSize = (doc: FlierDoc, a: LineKey, b: LineKey): FlierDoc => tie(doc, LineTieKind.Size, a, b);
