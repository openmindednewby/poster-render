import { LayoutId } from '../enums/LayoutId';
import { bodyGroups, flankPriceGroups, headerGroups } from '../layout/blockGroups';
import { geometry, type LayoutGeometry } from '../layout/geometry';
import { emptyFlow, flow, type FlowResult } from '../layout/textFlow';
import type { FlierDoc, FontSet, Palette, PosterContext, Rect } from '../types';
import { equalFlanks } from './regions';

export const FLOOR_PX = 30;
const BASE = 1080;
const LINE_HEIGHT = 1.2;
const LOGO_SHARE = 0.26;
const GIVE_STEP = 0.025;
const GIVE_STEPS = 32;
const SHIFT_STEP = 0.06;
const SHIFT_STEPS = 8;

export interface FittedText {
  geo: LayoutGeometry;
  zones: { text: Rect; logo: Rect };
  head: FlowResult;
  body: FlowResult;
  sides: FlowResult[];
}

interface Reflow {
  shift: number;
  compact: boolean;
  wrap: boolean;
  lift: boolean;
}

const MARGIN = 0.045;

interface FitInput {
  doc: FlierDoc;
  palette: Palette;
  fonts: FontSet;
  width: number;
  height: number;
}

function splitHeader(header: Rect, hasLogo: boolean): { text: Rect; logo: Rect } {
  const logoW = hasLogo ? Math.round(header.w * LOGO_SHARE) : 0;
  return { text: { ...header, w: header.w - logoW * 1.1 }, logo: { ...header, x: header.x + header.w - logoW, w: logoW } };
}

function headerAt(zones: { text: Rect; logo: Rect }, top: number | undefined, u: number): { text: Rect; logo: Rect } {
  if (top === undefined) {
    return zones;
  }
  const y = Math.round(top * u);
  return { ...zones, text: { ...zones.text, y, h: Math.max(1, zones.text.y + zones.text.h - y) } };
}

function closeHeaderGap(geo: LayoutGeometry, head: FlowResult, gap: number | undefined, u: number): LayoutGeometry {
  const { header, body } = geo;
  const stacked = header.y + header.h <= body.y && header.x < body.x + body.w && body.x < header.x + header.w;
  if (gap === undefined || !stacked || head.texts.length === 0) {
    return geo;
  }
  const top = Math.round(Math.max(...head.texts.map((t) => t.box.y + t.box.h)) + gap * u);
  return top < body.y ? { ...geo, body: { ...body, y: top, h: body.h + body.y - top } } : geo;
}

function tunedGeo(geo: LayoutGeometry, doc: FlierDoc, u: number): LayoutGeometry {
  const top = doc.tuning?.bodyTop;
  const width = doc.rows?.textWidth;
  let { header, body } = geo;
  if (top !== undefined) {
    const y = Math.round(top * u);
    header = { ...header, h: Math.max(1, y - header.y) };
    body = { ...body, y, h: Math.max(1, body.y + body.h - y) };
  }
  if (width !== undefined) {
    body = { ...body, w: Math.round(width * u) };
  }
  return { ...geo, header, body };
}

function widened(zones: { text: Rect; logo: Rect }, size: { w?: number; h?: number }, u: number): { text: Rect; logo: Rect } {
  const { text } = zones;
  return { ...zones, text: { ...text, w: size.w === undefined ? text.w : Math.round(size.w * u), h: size.h === undefined ? text.h : Math.round(size.h * u) } };
}

function flowAll(ctx: PosterContext, input: FitInput, base: LayoutGeometry, reflow: Reflow): FittedText {
  const { doc, palette, fonts } = input;
  const u = Math.min(input.width, input.height) / BASE;
  const geo = tunedGeo(base, doc, u);
  const zones = widened(headerAt(geo.logo ? { text: geo.header, logo: geo.logo } : splitHeader(geo.header, doc.logo !== undefined), doc.tuning?.headerTop, u), { w: doc.tuning?.headerTextWidth, h: doc.tuning?.headerHeight }, u);
  const head = flow(ctx, headerGroups(doc, palette, u), zones.text, fonts);
  const flanks = geo.flanks ?? [];
  const tight = closeHeaderGap(geo, head, doc.tuning?.headerGap, u);
  const body = flow(ctx, bodyGroups(doc, palette, u, { withPrices: flanks.length === 0, compact: reflow.compact, wrap: reflow.wrap, dateScale: doc.tuning?.itemDateScale }), { ...tight.body, room: Math.max(tight.body.w, base.body.w) }, fonts);
  const sides = flanks.length > 0 ? equalFlanks(ctx, flankPriceGroups(doc, palette, u), flanks, fonts) : [emptyFlow()];
  return { geo: tight, zones, head, body, sides };
}

const smallest = (t: FittedText): number => Math.min(Infinity, ...[t.head, t.body, ...t.sides].flatMap((f) => f.texts.map((x) => x.box.h / LINE_HEIGHT)));

function shiftHeader(geo: LayoutGeometry, shift: number): LayoutGeometry {
  const { header, body } = geo;
  const stacked = header.y + header.h <= body.y && header.x < body.x + body.w && body.x < header.x + header.w;
  const d = Math.round(header.h * shift);
  if (!stacked || d === 0 || body.h - d <= 0) {
    return geo;
  }
  return { ...geo, header: { ...header, h: header.h - d }, body: { ...body, y: body.y - d, h: body.h + d } };
}

function liftHeader(geo: LayoutGeometry, top: number): LayoutGeometry {
  const { header } = geo;
  return header.y > top ? { ...geo, header: { ...header, y: top, h: header.h + header.y - top } } : geo;
}

function fitBottom(ctx: PosterContext, input: FitInput, floor: number): FittedText {
  const { width, height } = input;
  const none: Reflow = { shift: 0, compact: false, wrap: false, lift: false };
  let fitted = flowAll(ctx, input, geometry(LayoutId.PictureBottom, width, height), none);
  for (let step = 1; step <= GIVE_STEPS && smallest(fitted) < floor; step++) {
    fitted = flowAll(ctx, input, geometry(LayoutId.PictureBottom, width, height, step * GIVE_STEP), none);
  }
  return fitted;
}

function yieldPicture(geo: LayoutGeometry, give: number): LayoutGeometry {
  const { picture: p, body: b } = geo;
  const d = Math.round(p.w * give);
  return { ...geo, picture: { ...p, x: p.x + d, w: p.w - d }, body: { ...b, w: b.w + d } };
}

function fitList(ctx: PosterContext, input: FitInput, floor: number, base: LayoutGeometry): FittedText {
  const last: Reflow = { shift: 0, compact: true, wrap: true, lift: false };
  let fitted = flowAll(ctx, input, base, last);
  for (let step = 1; step <= GIVE_STEPS && smallest(fitted) < floor; step++) {
    fitted = flowAll(ctx, input, yieldPicture(base, step * GIVE_STEP), last);
  }
  return fitted;
}

const SHIFTS = [0, ...Array.from({ length: SHIFT_STEPS }, (_v, i) => [(i + 1) * SHIFT_STEP, -(i + 1) * SHIFT_STEP]).flat()];
const TIERS = [
  { compact: false, wrap: false, lift: false },
  { compact: true, wrap: false, lift: false },
  { compact: true, wrap: true, lift: false },
  { compact: true, wrap: true, lift: true },
];
const REFLOWS: Reflow[] = TIERS.flatMap((tier) => SHIFTS.map((shift) => ({ ...tier, shift })));

/** Flows header, body and flanks until every run reaches 30px at a 1080 short edge: picture-bottom and list narrow their picture as a last step; every other layout moves the header line, sets rows on one line, wraps long lines and lifts the header into empty space, never shrinking the picture. */
export function fitToFloor(ctx: PosterContext, input: FitInput): FittedText {
  const { doc, width, height } = input;
  const floor = (FLOOR_PX * Math.min(width, height)) / BASE;
  if (doc.layout === LayoutId.PictureBottom) {
    return fitBottom(ctx, input, floor);
  }
  const base = geometry(doc.layout, width, height);
  const top = Math.round(Math.min(width, height) * MARGIN);
  let best: FittedText | null = null;
  for (const reflow of REFLOWS) {
    const fitted = flowAll(ctx, input, shiftHeader(reflow.lift ? liftHeader(base, top) : base, reflow.shift), reflow);
    if (smallest(fitted) >= floor) {
      return fitted;
    }
    best = best === null || smallest(fitted) > smallest(best) ? fitted : best;
  }
  if (doc.layout === LayoutId.List) {
    return fitList(ctx, input, floor, base);
  }
  return best ?? flowAll(ctx, input, base, { shift: 0, compact: false, wrap: false, lift: false });
}
