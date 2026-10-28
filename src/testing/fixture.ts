import { createCanvas, type Canvas, type Image } from '@napi-rs/canvas';
import type { PosterCanvas, Rect } from '../types';

export const FIXTURE_W = 576;
export const FIXTURE_H = 1069;
export const OPAQUE: Rect = { x: 40, y: 25, w: 496, h: 1044 };
export const GREEN = [0, 255, 0];

export function fixtureImage(): Canvas {
  const c = createCanvas(FIXTURE_W, FIXTURE_H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillRect(OPAQUE.x, OPAQUE.y, OPAQUE.w, OPAQUE.h);
  return c;
}

export function newCanvas(): Canvas {
  return createCanvas(1, 1);
}

export function asPoster(c: Canvas): PosterCanvas {
  return c as unknown as PosterCanvas;
}

export function opaqueRectOn(picture: Rect): Rect {
  const sx = picture.w / FIXTURE_W;
  const sy = picture.h / FIXTURE_H;
  return { x: picture.x + OPAQUE.x * sx, y: picture.y + OPAQUE.y * sy, w: OPAQUE.w * sx, h: OPAQUE.h * sy };
}

export function pixels(c: Canvas): Uint8ClampedArray {
  return c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
}

export function inset(r: Rect, d: number): { x0: number; y0: number; x1: number; y1: number } {
  return { x0: Math.ceil(r.x + d), y0: Math.ceil(r.y + d), x1: Math.floor(r.x + r.w - d), y1: Math.floor(r.y + r.h - d) };
}

export function hexRgb(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export type FixtureImage = Image | Canvas;

export const TALL_W = 576;
export const TALL_H = 1009;

export function tallImage(): Canvas {
  const c = createCanvas(TALL_W, TALL_H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillRect(0, 0, TALL_W, TALL_H);
  return c;
}
