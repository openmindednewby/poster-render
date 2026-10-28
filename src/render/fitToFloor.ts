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

function flowAll(ctx: PosterContext, input: FitInput, geo: LayoutGeometry, reflow: Reflow): FittedText {
  const { doc, palette, fonts } = input;
  const u = Math.min(input.width, input.height) / BASE;
  const zones = geo.logo ? { text: geo.header, logo: geo.logo } : splitHeader(geo.header, doc.logo !== undefined);
  const head = flow(ctx, headerGroups(doc, palette, u), zones.text, fonts);
  const flanks = geo.flanks ?? [];
  const body = flow(ctx, bodyGroups(doc, palette, u, { withPrices: flanks.length === 0, compact: reflow.compact, wrap: reflow.wrap }), geo.body, fonts);
  const sides = flanks.length > 0 ? equalFlanks(ctx, flankPriceGroups(doc, palette, u), flanks, fonts) : [emptyFlow()];
  return { geo, zones, head, body, sides };
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

const SHIFTS = [0, ...Array.from({ length: SHIFT_STEPS }, (_v, i) => [(i + 1) * SHIFT_STEP, -(i + 1) * SHIFT_STEP]).flat()];
const TIERS = [
  { compact: false, wrap: false, lift: false },
  { compact: true, wrap: false, lift: false },
  { compact: true, wrap: true, lift: false },
  { compact: true, wrap: true, lift: true },
];
const REFLOWS: Reflow[] = TIERS.flatMap((tier) => SHIFTS.map((shift) => ({ ...tier, shift })));

/** Flows header, body and flanks until every run reaches 30px at a 1080 short edge: picture-bottom narrows its picture; every other layout moves the header line, sets rows on one line, wraps long lines and lifts the header into empty space, never shrinking the picture. */
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
  return best ?? flowAll(ctx, input, base, { shift: 0, compact: false, wrap: false, lift: false });
}
