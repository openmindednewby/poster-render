import { LineTieKind } from '../enums/LineTieKind';
import type { FlierDoc, LineStyle, LineTie } from '../types';
import type { FlowLine } from './textFlow';

export interface StyleContext {
  styles: Record<string, LineStyle | undefined>;
  width: Map<string, number>;
  size: Map<string, number>;
}

function tieIds(ties: LineTie[], kind: LineTieKind): Map<string, number> {
  const ids = new Map<string, number>();
  ties
    .filter((t) => t.kind === kind)
    .forEach((t, n) => {
      const [a, b] = t.lines;
      const ia = ids.get(a);
      const ib = ids.get(b);
      const id = ia ?? ib ?? n;
      ids.set(a, id);
      ids.set(b, id);
      if (ib !== undefined && ib !== id) {
        [...ids.entries()].filter(([, v]) => v === ib).forEach(([key]) => ids.set(key, id));
      }
    });
  return ids;
}

/** The doc's line styles and tie ids, ready for the line makers. */
export function styleContext(doc: FlierDoc): StyleContext {
  const ties = doc.lineTies ?? [];
  return { styles: doc.lineStyles ?? {}, width: tieIds(ties, LineTieKind.Width), size: tieIds(ties, LineTieKind.Size) };
}

/** Applies the style and ties named by key; a line with neither comes back unchanged. */
export function styled(line: FlowLine, key: string, sc: StyleContext): FlowLine {
  const style = Object.hasOwn(sc.styles, key) ? sc.styles[key] : undefined;
  const widthTie = sc.width.get(key);
  const sizeTie = sc.size.get(key);
  if (style === undefined && widthTie === undefined && sizeTie === undefined) {
    return { ...line, key };
  }
  const size = line.size * (style?.sizeScale ?? 1);
  return {
    ...line,
    key,
    size,
    color: style?.color ?? line.color,
    weight: style?.weight ?? line.weight,
    family: style?.font,
    italic: style?.italic,
    spacing: style?.letterSpacing,
    widthScale: style?.widthScale,
    fixedSize: style?.sizeScale === undefined ? undefined : true,
    align: style?.align,
    spaceAbove: style?.spaceAbove === undefined ? undefined : style.spaceAbove * size,
    spaceBelow: style?.spaceBelow === undefined ? undefined : style.spaceBelow * size,
    widthTie,
    sizeTie,
  };
}
