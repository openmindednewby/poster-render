import { BackgroundStyle } from '../enums/BackgroundStyle';
import { PictureAnchor } from '../enums/PictureAnchor';
import { FONT_SETS } from '../fontSets';
import { FORMAT_SIZES } from '../formats';
import { bodyGroups, flankPriceGroups, headerGroups } from '../layout/blockGroups';
import { geometry, placeContain, type LayoutGeometry } from '../layout/geometry';
import { emptyFlow, flow, type FlowGroup, type FlowResult } from '../layout/textFlow';
import { PALETTES } from '../palettes';
import { FlierDocError, missingAssets, validateFlierDoc } from '../schema/validateFlierDoc';
import type { FlierDoc, FontSet, PosterAssets, PosterCanvas, PosterContext, Rect, RenderReport } from '../types';

const BASE = 1080;
const LOGO_SHARE = 0.26;
const CARD_RADIUS = 0.035;
const CAP_TOP = 0.15;

function roundRect(ctx: PosterContext, r: Rect, radius: number): void {
  const rad = Math.min(radius, r.w / 2, r.h / 2);
  ctx.beginPath();
  ctx.moveTo(r.x + rad, r.y);
  ctx.arcTo(r.x + r.w, r.y, r.x + r.w, r.y + r.h, rad);
  ctx.arcTo(r.x + r.w, r.y + r.h, r.x, r.y + r.h, rad);
  ctx.arcTo(r.x, r.y + r.h, r.x, r.y, rad);
  ctx.arcTo(r.x, r.y, r.x + r.w, r.y, rad);
  ctx.closePath();
  ctx.fill();
}

function drawFlow(ctx: PosterContext, f: FlowResult, radius: number): void {
  f.rules.forEach((r) => {
    ctx.fillStyle = r.color;
    ctx.fillRect(r.rect.x, r.rect.y, r.rect.w, r.rect.h);
  });
  f.cards.forEach((c) => {
    ctx.fillStyle = c.color;
    roundRect(ctx, c.rect, radius);
  });
  f.bullets.forEach((b) => {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  f.texts.forEach((t) => {
    ctx.font = t.font;
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.box.x, t.box.y);
  });
}

function checked(input: unknown, assets: PosterAssets): FlierDoc {
  const result = validateFlierDoc(input);
  if (!result.ok) {
    throw new FlierDocError(result.errors);
  }
  const missing = missingAssets(result.doc, assets);
  if (missing.length > 0) {
    throw new FlierDocError(missing);
  }
  return result.doc;
}

function archRect(geo: LayoutGeometry): Rect | null {
  if (geo.arch === undefined) {
    return null;
  }
  const top = geo.picture.y + Math.round(geo.picture.h * geo.arch);
  return { x: geo.picture.x, y: top, w: geo.picture.w, h: geo.picture.y + geo.picture.h - top };
}

function drawArch(ctx: PosterContext, r: Rect, color: string): void {
  const rad = r.w / 2;
  ctx.fillStyle = color;
  ctx.fillRect(r.x, r.y + rad, r.w, r.h - rad);
  ctx.beginPath();
  ctx.arc(r.x + rad, r.y + rad, rad, Math.PI, Math.PI * 2);
  ctx.fill();
}

function flankFlows(ctx: PosterContext, groups: FlowGroup[], flanks: Rect[], fonts: FontSet): FlowResult[] {
  const half = Math.ceil(groups.length / 2);
  return flanks.map((zone, i) => (i === 0 ? flow(ctx, groups.slice(0, half), zone, fonts) : flow(ctx, groups.slice(half), { ...zone, right: true }, fonts)));
}

function capAligned(zone: Rect, head: FlowResult): Rect {
  const first = head.texts[0]?.box;
  const shift = first ? Math.min(Math.max(0, Math.round(first.y + first.h * CAP_TOP) - zone.y), Math.round(zone.h / 2)) : 0;
  return { ...zone, y: zone.y + shift, h: zone.h - shift };
}

function splitHeader(header: Rect, hasLogo: boolean): { text: Rect; logo: Rect } {
  const logoW = hasLogo ? Math.round(header.w * LOGO_SHARE) : 0;
  return { text: { ...header, w: header.w - logoW * 1.1 }, logo: { ...header, x: header.x + header.w - logoW, w: logoW } };
}

/** Validates the doc, then draws it on the canvas (resized to the format); throws FlierDocError before touching the canvas. */
export function render(input: unknown, assets: PosterAssets, canvas: PosterCanvas): RenderReport {
  const doc = checked(input, assets);
  const { width, height } = FORMAT_SIZES[doc.format];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('poster-render: the canvas has no 2d context');
  }
  const palette = PALETTES[doc.palette];
  const fonts = FONT_SETS[doc.fonts];
  const geo = geometry(doc.layout, width, height);
  const u = Math.min(width, height) / BASE;
  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);
  if (doc.background === BackgroundStyle.Tint) {
    ctx.fillStyle = palette.tint;
    [geo.header, geo.body].forEach((r) => ctx.fillRect(r.x, r.y, r.w, r.h));
  }
  const zones = geo.logo ? { text: geo.header, logo: geo.logo } : splitHeader(geo.header, doc.logo !== undefined);
  const head = flow(ctx, headerGroups(doc, palette, u), zones.text, fonts);
  const flanks = geo.flanks ?? [];
  const body = flow(ctx, bodyGroups(doc, palette, u, flanks.length === 0), geo.body, fonts);
  const sides = flanks.length > 0 ? flankFlows(ctx, flankPriceGroups(doc, palette, u), flanks, fonts) : [emptyFlow()];
  const radius = Math.min(width, height) * CARD_RADIUS;
  [head, body, ...sides].forEach((f) => drawFlow(ctx, f, radius));
  const logoImage = doc.logo ? assets[doc.logo.imageId] : undefined;
  if (logoImage) {
    const r = placeContain(logoImage, capAligned(zones.logo, head), PictureAnchor.Top, 1, 1);
    ctx.drawImage(logoImage, r.x, r.y, r.w, r.h);
  }
  const image = doc.picture ? assets[doc.picture.imageId] : undefined;
  const backdrop = image ? archRect(geo) : null;
  if (backdrop) {
    drawArch(ctx, backdrop, palette.arch);
  }
  const picture = image && doc.picture ? placeContain(image, geo.picture, doc.picture.anchor, geo.alignX, doc.picture.scale) : null;
  if (image && picture) {
    ctx.drawImage(image, picture.x, picture.y, picture.w, picture.h);
  }
  return {
    width,
    height,
    picture,
    pictureRegion: geo.picture,
    textBoxes: [head, body, ...sides].flatMap((f) => f.texts.map((t) => t.box)),
    cardBoxes: body.cards.map((c) => c.rect),
    backdrop,
  };
}
