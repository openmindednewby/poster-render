import { LayoutId } from '../enums/LayoutId';
import { bodyGroups, flankPriceGroups, headerGroups } from '../layout/blockGroups';
import { geometry, type LayoutGeometry } from '../layout/geometry';
import { emptyFlow, flow, type FlowResult } from '../layout/textFlow';
import type { FlierDoc, FontSet, Palette, PosterContext, Rect } from '../types';
import { equalFlanks } from './regions';
import { yieldToText } from './yieldToText';

export const FLOOR_PX = 30;
const BASE = 1080;
const LINE_HEIGHT = 1.2;
const LOGO_SHARE = 0.26;
const GIVE_STEP = 0.025;
const GIVE_STEPS = 32;

export interface FittedText {
  geo: LayoutGeometry;
  zones: { text: Rect; logo: Rect };
  head: FlowResult;
  body: FlowResult;
  sides: FlowResult[];
}

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

function flowAll(ctx: PosterContext, input: FitInput, geo: LayoutGeometry, u: number): FittedText {
  const { doc, palette, fonts } = input;
  const zones = geo.logo ? { text: geo.header, logo: geo.logo } : splitHeader(geo.header, doc.logo !== undefined);
  const head = flow(ctx, headerGroups(doc, palette, u), zones.text, fonts);
  const flanks = geo.flanks ?? [];
  const body = flow(ctx, bodyGroups(doc, palette, u, flanks.length === 0), geo.body, fonts);
  const sides = flanks.length > 0 ? equalFlanks(ctx, flankPriceGroups(doc, palette, u), flanks, fonts) : [emptyFlow()];
  return { geo, zones, head, body, sides };
}

const smallest = (t: FittedText): number => Math.min(Infinity, ...[t.head, t.body, ...t.sides].flatMap((f) => f.texts.map((x) => x.box.h / LINE_HEIGHT)));

function geometryWithGive(layout: LayoutId, width: number, height: number, give: number): LayoutGeometry {
  return layout === LayoutId.PictureBottom ? geometry(layout, width, height, give) : yieldToText(geometry(layout, width, height), give);
}

/** Flows header, body and flanks, giving picture space to the text until every run reaches 30px at a 1080 short edge. */
export function fitToFloor(ctx: PosterContext, input: FitInput): FittedText {
  const { doc, width, height } = input;
  const u = Math.min(width, height) / BASE;
  const floor = FLOOR_PX * u;
  let fitted = flowAll(ctx, input, geometryWithGive(doc.layout, width, height, 0), u);
  for (let step = 1; step <= GIVE_STEPS && smallest(fitted) < floor; step++) {
    fitted = flowAll(ctx, input, geometryWithGive(doc.layout, width, height, step * GIVE_STEP), u);
  }
  return fitted;
}
