import { paintGround } from './background';
import { BackgroundStyle } from '../enums/BackgroundStyle';
import { PictureAnchor } from '../enums/PictureAnchor';
import { FONT_SETS } from '../fontSets';
import { FORMAT_SIZES } from '../formats';
import { placeContain, type LayoutGeometry } from '../layout/geometry';
import type { FlowResult } from '../layout/textFlow';
import { PALETTES } from '../palettes';
import { FlierDocError, missingAssets, validateFlierDoc } from '../schema/validateFlierDoc';
import { fitToFloor } from './fitToFloor';
import { pictureRegion } from './regions';
import type { FlierDoc, PosterAssets, PosterCanvas, PosterContext, Rect, RenderReport } from '../types';

const BASE = 1080;
const NO_SPACING = '0px';
const CARD_RADIUS = 0.035;
const CAP_TOP = 0.15;
const PIN_HEAD_Y = 0.08;
const PIN_HEAD_R = 0.19;
const PIN_TIP_Y = 0.28;
const PIN_HOLE = 0.42;
const ARC_START = 0.75;
const ARC_END = 2.25;

function drawPin(ctx: PosterContext, r: Rect, color: string, glyph: string): void {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const hy = cy - r.w * PIN_HEAD_Y;
  const rad = r.w * PIN_HEAD_R;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r.w / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = glyph;
  ctx.beginPath();
  ctx.moveTo(cx, cy + r.w * PIN_TIP_Y);
  ctx.arc(cx, hy, rad, Math.PI * ARC_START, Math.PI * ARC_END);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, hy, rad * PIN_HOLE, 0, Math.PI * 2);
  ctx.fill();
}

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
  f.icons.forEach((i) => drawPin(ctx, i.rect, i.color, i.glyph));
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  f.texts.forEach((t) => {
    ctx.font = t.font;
    ctx.fillStyle = t.color;
    if (t.spacing !== undefined) {
      ctx.letterSpacing = t.spacing;
    }
    ctx.fillText(t.text, t.box.x, t.box.y);
    if (t.spacing !== undefined) {
      ctx.letterSpacing = NO_SPACING;
    }
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

function capAligned(zone: Rect, head: FlowResult): Rect {
  const first = head.texts[0]?.box;
  const shift = first ? Math.min(Math.max(0, Math.round(first.y + first.h * CAP_TOP) - zone.y), Math.round(zone.h / 2)) : 0;
  return { ...zone, y: zone.y + shift, h: zone.h - shift };
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
  const u = Math.min(width, height) / BASE;
  const { geo, zones, head, body, sides } = fitToFloor(ctx, { doc, palette, fonts, width, height });
  ctx.globalAlpha = 1;
  paintGround(ctx, doc.background, palette, { width, height });
  if (doc.background === BackgroundStyle.Tint) {
    ctx.fillStyle = palette.tint;
    [geo.header, geo.body].forEach((r) => ctx.fillRect(r.x, r.y, r.w, r.h));
  }
  const radius = Math.min(width, height) * CARD_RADIUS;
  [head, body, ...sides].forEach((f) => drawFlow(ctx, f, radius));
  const logoImage = doc.logo ? assets[doc.logo.imageId] : undefined;
  const logo = logoImage ? placeContain(logoImage, geo.logo ? zones.logo : capAligned(zones.logo, head), { anchor: PictureAnchor.Top, alignX: 1, scale: 1 }) : null;
  if (logoImage && logo) {
    ctx.drawImage(logoImage, logo.x, logo.y, logo.w, logo.h);
  }
  const image = doc.picture ? assets[doc.picture.imageId] : undefined;
  const backdrop = image ? archRect(geo) : null;
  if (backdrop) {
    drawArch(ctx, backdrop, palette.arch);
  }
  const region = pictureRegion(doc.layout, geo, body, { width, height, u });
  const picture = image && doc.picture ? placeContain(image, region, { anchor: doc.picture.anchor, alignX: geo.alignX, scale: doc.picture.scale }) : null;
  if (image && picture) {
    ctx.drawImage(image, picture.x, picture.y, picture.w, picture.h);
  }
  return {
    width,
    height,
    picture,
    pictureRegion: region,
    textBoxes: [head, body, ...sides].flatMap((f) => f.texts.map((t) => t.box)),
    cardBoxes: body.cards.map((c) => c.rect),
    iconBoxes: [head, body, ...sides].flatMap((f) => f.icons.map((i) => i.rect)),
    logo,
    backdrop,
  };
}
