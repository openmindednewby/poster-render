import type { PosterContext } from '../types';

export type Point = readonly [number, number];

/** Fills a closed polygon through the points with the current fill style. */
export function polygon(ctx: PosterContext, pts: readonly Point[]): void {
  const first = pts[0];
  if (!first) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(first[0], first[1]);
  pts.slice(1).forEach((p, i) => {
    const next = pts[i + 2] ?? first;
    ctx.arcTo(p[0], p[1], next[0], next[1], 0);
  });
  ctx.closePath();
  ctx.fill();
}

/** Fills a circle. */
export function disc(ctx: PosterContext, c: Point, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(c[0], c[1], Math.max(0, r), 0, Math.PI * 2);
  ctx.fill();
}

/** The corners of a w x h rectangle centred on c and turned by angle radians. */
export function turnedRect(c: Point, size: { w: number; h: number }, angle: number): Point[] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const hw = size.w / 2;
  const hh = size.h / 2;
  const corners: Point[] = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
  return corners.map(([px, py]): Point => [c[0] + px * cos - py * sin, c[1] + px * sin + py * cos]);
}
