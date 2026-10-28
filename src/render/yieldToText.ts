import type { LayoutGeometry } from '../layout/geometry';

/** Moves the picture edge that faces the body by give of the picture's size, handing that space to the body (and to a header stacked above it). */
export function yieldToText(geo: LayoutGeometry, give: number): LayoutGeometry {
  const { picture: p, body: b } = geo;
  if (give <= 0) {
    return geo;
  }
  if (p.x >= b.x + b.w) {
    const d = Math.round(p.w * give);
    return { ...geo, picture: { ...p, x: p.x + d, w: p.w - d }, body: { ...b, w: b.w + d } };
  }
  if (p.x + p.w <= b.x) {
    const d = Math.round(p.w * give);
    return { ...geo, picture: { ...p, w: p.w - d }, body: { ...b, x: b.x - d, w: b.w + d } };
  }
  if (p.y >= b.y + b.h) {
    const d = Math.round(p.h * give);
    const stacked = geo.header.y + geo.header.h <= b.y;
    const toHeader = stacked ? Math.round(d / 2) : 0;
    return {
      ...geo,
      header: { ...geo.header, h: geo.header.h + toHeader },
      picture: { ...p, y: p.y + d, h: p.h - d },
      body: { ...b, y: b.y + toHeader, h: b.h + d - toHeader },
      flanks: geo.flanks?.map((f) => ({ ...f, y: f.y + d, h: f.h - d })),
    };
  }
  return geo;
}
