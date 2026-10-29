import { ANCHOR_Y, placeContain } from '../layout/geometry';
import type { PictureSlot, PosterImage, Rect } from '../types';

interface Frame {
  width: number;
  height: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi);

/** Places the picture in its region, grown and shifted by its overlap and kept on the canvas. */
export function placePicture(image: PosterImage, region: Rect, slot: PictureSlot, fit: { alignX: number; frame: Frame }): Rect {
  const base = placeContain(image, region, { anchor: slot.anchor, alignX: fit.alignX, scale: slot.scale });
  const o = slot.overlap;
  if (o === undefined) {
    return base;
  }
  const { width, height } = fit.frame;
  const s = Math.min(o.scale, width / Math.max(base.w, 1), height / Math.max(base.h, 1));
  const w = Math.floor(base.w * s);
  const h = Math.floor(base.h * s);
  const x = base.x + (base.w - w) * fit.alignX + o.dx * width;
  const y = base.y + (base.h - h) * ANCHOR_Y[slot.anchor] + o.dy * height;
  return { x: Math.round(clamp(x, 0, width - w)), y: Math.round(clamp(y, 0, height - h)), w, h };
}

/** Ends every rule level with the picture at its left edge plus reach of its width. */
export function reachPicture(rules: { rect: Rect }[], picture: Rect, reach: number): void {
  const end = picture.x + picture.w * reach;
  rules
    .filter((r) => r.rect.y >= picture.y && r.rect.y <= picture.y + picture.h)
    .forEach((r) => {
      r.rect.w = Math.max(0, end - r.rect.x);
    });
}
