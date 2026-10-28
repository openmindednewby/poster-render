import { LayoutId } from '../enums/LayoutId';
import { PictureAnchor } from '../enums/PictureAnchor';
import type { PosterImage, Rect } from '../types';
import { LAYOUT_SPECS, toRect } from './layoutSpecs';

export interface LayoutGeometry {
  header: Rect;
  body: Rect;
  picture: Rect;
  alignX: number;
  flanks?: Rect[];
  logo?: Rect;
  arch?: number;
}

const MARGIN = 0.045;
const HEADER_PORTRAIT = 0.3;
const HEADER_LANDSCAPE = 0.36;
const BOTTOM_PICTURE_W = 0.8;
const BOTTOM_MIN_TOP = 0.25;
const BOTTOM_HEADER_SHARE = 0.3;
const BOTTOM_GAP = 40 / 1080;
const BOTTOM_ASPECT = 0.57;
const PICTURE_SIDE: Record<string, [number, number]> = {
  [LayoutId.PictureRight]: [0.6, 0.42],
  [LayoutId.PictureLeft]: [0.6, 0.42],
  [LayoutId.List]: [0.5, 0.36],
};
const ANCHOR_Y: Record<PictureAnchor, number> = { [PictureAnchor.Top]: 0, [PictureAnchor.Center]: 0.5, [PictureAnchor.Bottom]: 1 };

const r = Math.round;

function side(w: number, h: number, fraction: [number, number]): LayoutGeometry {
  const m = r(Math.min(w, h) * MARGIN);
  if (h >= w) {
    const split = r(w * (1 - fraction[0]));
    const top = r(h * HEADER_PORTRAIT);
    return {
      header: { x: m, y: m, w: w - 2 * m, h: top - 2 * m },
      picture: { x: split, y: top, w: w - split, h: h - top },
      body: { x: m, y: top, w: split - 2 * m, h: h - top - m },
      alignX: 1,
    };
  }
  const split = r(w * (1 - fraction[1]));
  const top = r(h * HEADER_LANDSCAPE);
  return {
    header: { x: m, y: m, w: split - 2 * m, h: top - m },
    picture: { x: split, y: 0, w: w - split, h },
    body: { x: m, y: top + r(m / 2), w: split - 2 * m, h: h - top - r(m / 2) - m },
    alignX: 1,
  };
}

function bottom(w: number, h: number, share: number): LayoutGeometry {
  const m = r(Math.min(w, h) * MARGIN);
  const gap = r(Math.min(w, h) * BOTTOM_GAP);
  const picW = r(w * share);
  const picH = Math.min(r(picW / BOTTOM_ASPECT), r(((h - r(h * BOTTOM_MIN_TOP)) * share) / BOTTOM_PICTURE_W));
  const pic = h - picH;
  const top = m + r((pic - m) * BOTTOM_HEADER_SHARE);
  return {
    header: { x: m, y: m, w: w - 2 * m, h: top - m },
    body: { x: m, y: top, w: w - 2 * m, h: pic - gap - top },
    picture: { x: r((w - picW) / 2), y: pic, w: picW, h: picH },
    alignX: 0.5,
  };
}

function fromSpec(spec: NonNullable<(typeof LAYOUT_SPECS)[LayoutId]>['portrait'], w: number, h: number): LayoutGeometry {
  return {
    header: toRect(spec.header, w, h),
    body: toRect(spec.body, w, h),
    picture: toRect(spec.picture, w, h),
    alignX: spec.alignX,
    flanks: spec.flanks?.map((f) => toRect(f, w, h)),
    logo: spec.logo ? toRect(spec.logo, w, h) : undefined,
    arch: spec.arch,
  };
}

const mirror = (rect: Rect, w: number): Rect => ({ ...rect, x: w - rect.x - rect.w });

/** Splits the canvas into header, body and picture regions that never overlap; give narrows the picture-bottom picture. */
export function geometry(layout: LayoutId, w: number, h: number, give = 0): LayoutGeometry {
  const oriented = LAYOUT_SPECS[layout];
  if (oriented) {
    return fromSpec(h >= w ? oriented.portrait : oriented.landscape, w, h);
  }
  if (layout === LayoutId.PictureBottom) {
    return bottom(w, h, BOTTOM_PICTURE_W - give);
  }
  const g = side(w, h, PICTURE_SIDE[layout] ?? [0.6, 0.42]);
  if (layout !== LayoutId.PictureLeft) {
    return g;
  }
  return { header: mirror(g.header, w), body: mirror(g.body, w), picture: mirror(g.picture, w), alignX: 1 - g.alignX };
}

/** Fits the whole image inside the region (contain), scaled and anchored; never crops it. */
export function placeContain(image: PosterImage, region: Rect, anchor: PictureAnchor, alignX: number, scale: number): Rect {
  const s = Math.min(region.w / image.width, region.h / image.height) * scale;
  const w = Math.floor(image.width * s);
  const h = Math.floor(image.height * s);
  return {
    x: region.x + Math.floor((region.w - w) * alignX),
    y: region.y + Math.floor((region.h - h) * ANCHOR_Y[anchor]),
    w,
    h,
  };
}
