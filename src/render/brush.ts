import type { PosterContext, Rect } from '../types';
import { polygon, type Point } from './shapes';

interface Cluster {
  x: number;
  y: number;
  w: number;
  h: number;
  tone: number;
}

const CLUSTERS: readonly Cluster[] = [
  { x: -0.14, y: 0.13, w: 0.42, h: 0.35, tone: 0 },
  { x: -0.16, y: 0.78, w: 0.36, h: 0.22, tone: 1 },
  { x: 0.78, y: 0.63, w: 0.3, h: 0.3, tone: 2 },
];
const STROKES = 7;
const ALPHA = 0.55;
const SLANT = -0.3;
const TAPER = 0.3;
const SEED = 42;
const PM_A = 16807;
const PM_M = 2147483647;
const JITTER = 0.3;
const MIN_LENGTH = 0.7;
const MIN_THICK = 0.6;
const THICK_RANGE = 0.8;
const HALF = 0.5;

function random(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * PM_A) % PM_M;
    return s / PM_M;
  };
}

function stroke(ctx: PosterContext, c: Point, length: number, thick: number): void {
  const dx = (Math.cos(SLANT) * length) / 2;
  const dy = (Math.sin(SLANT) * length) / 2;
  const nx = -Math.sin(SLANT);
  const ny = Math.cos(SLANT);
  const a = thick / 2;
  const b = (thick * TAPER) / 2;
  polygon(ctx, [
    [c[0] - dx + nx * a, c[1] - dy + ny * a],
    [c[0] + dx + nx * b, c[1] + dy + ny * b],
    [c[0] + dx - nx * b, c[1] + dy - ny * b],
    [c[0] - dx - nx * a, c[1] - dy - ny * a],
  ]);
}

/** Paints the same soft dry-brush strokes beside and under the picture box on every run. */
export function paintBrush(ctx: PosterContext, picture: Rect, colors: readonly string[]): void {
  if (colors.length === 0) {
    return;
  }
  const next = random(SEED);
  ctx.globalAlpha = ALPHA;
  CLUSTERS.forEach((cl) => {
    ctx.fillStyle = colors[cl.tone % colors.length] ?? colors[0] ?? '';
    const box: Rect = { x: picture.x + picture.w * cl.x, y: picture.y + picture.h * cl.y, w: picture.w * cl.w, h: picture.h * cl.h };
    for (let i = 0; i < STROKES; i++) {
      const c: Point = [box.x + box.w * (HALF + (next() - HALF) * JITTER), box.y + (box.h * (i + HALF)) / STROKES];
      stroke(ctx, c, box.w * (MIN_LENGTH + (1 - MIN_LENGTH) * next()), (box.h / STROKES) * (MIN_THICK + THICK_RANGE * next()));
    }
  });
  ctx.globalAlpha = 1;
}
