import { paintPage } from './background';
import { PictureAnchor } from '../enums/PictureAnchor';
import { FONT_SETS } from '../fontSets';
import { FORMAT_SIZES } from '../formats';
import { placeContain, type LayoutGeometry } from '../layout/geometry';
import type { FlowResult } from '../layout/textFlow';
import { PALETTES } from '../palettes';
import { FlierDocError, missingAssets, validateFlierDoc } from '../schema/validateFlierDoc';
import { fitToFloor, type FittedText } from './fitToFloor';
import { placePicture, reachPicture } from './overlap';
import { pictureRegion } from './regions';
import { drawRowIcon } from './rowIcons';
import type { FlierDoc, PosterAssets, PosterCanvas, PosterContext, PosterImage, Rect, RenderReport } from '../types';

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
const BARE_SCALE = 1.6;

function drawPin(ctx: PosterContext, r: Rect, colors: { color: string; glyph: string }, bare = false): void {
  const { color, glyph } = bare ? { color: colors.glyph, glyph: colors.color } : colors;
  const w = bare ? r.w * BARE_SCALE : r.w;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const hy = cy - w * PIN_HEAD_Y;
  const rad = w * PIN_HEAD_R;
  if (!bare) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r.w / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = glyph;
  ctx.beginPath();
  ctx.moveTo(cx, cy + w * PIN_TIP_Y);
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

function drawRules(ctx: PosterContext, f: FlowResult): void {
  f.rules.forEach((r) => {
    ctx.fillStyle = r.color;
    ctx.fillRect(r.rect.x, r.rect.y, r.rect.w, r.rect.h);
  });
}

function drawMarks(ctx: PosterContext, f: FlowResult, radius: number): void {
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
  f.icons.forEach((i) => (i.kind === undefined ? drawPin(ctx, i.rect, { color: i.color, glyph: i.glyph }, i.bare) : drawRowIcon(ctx, i.rect, i.kind, { fill: i.color, glyph: i.glyph })));
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

function drawFlow(ctx: PosterContext, f: FlowResult, radius: number): void {
  drawRules(ctx, f);
  drawMarks(ctx, f, radius);
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

interface Placed {
  image: PosterImage | undefined;
  region: Rect;
  picture: Rect | null;
}

function placeOnPage(doc: FlierDoc, assets: PosterAssets, fitted: FittedText, frame: { width: number; height: number; u: number }): Placed {
  const image = doc.picture ? assets[doc.picture.imageId] : undefined;
  const region = pictureRegion(doc.layout, fitted.geo, fitted.body, frame);
  const picture = image && doc.picture ? placePicture(image, region, doc.picture, { alignX: fitted.geo.alignX, frame }) : null;
  const dividers = doc.rows?.dividers;
  if (picture && dividers?.toPicture === true) {
    reachPicture(fitted.body.rules, picture, dividers.reach ?? 0);
  }
  return { image, region, picture };
}

function drawLogo(ctx: PosterContext, doc: FlierDoc, assets: PosterAssets, fitted: FittedText): Rect | null {
  const logoImage = doc.logo ? assets[doc.logo.imageId] : undefined;
  const zone = fitted.geo.logo ? fitted.zones.logo : capAligned(fitted.zones.logo, fitted.head);
  const logo = logoImage ? placeContain(logoImage, zone, { anchor: PictureAnchor.Top, alignX: 1, scale: 1 }) : null;
  if (logoImage && logo) {
    ctx.drawImage(logoImage, logo.x, logo.y, logo.w, logo.h);
  }
  return logo;
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
  const fitted = fitToFloor(ctx, { doc, palette, fonts: FONT_SETS[doc.fonts], width, height });
  const { geo, head, body, sides } = fitted;
  const { image, region, picture } = placeOnPage(doc, assets, fitted, { width, height, u: Math.min(width, height) / BASE });
  paintPage(ctx, doc, palette, { geo, width, height, picture });
  const radius = Math.min(width, height) * CARD_RADIUS;
  const flows = [head, body, ...sides];
  const layered = doc.picture?.overlap !== undefined;
  flows.forEach((f) => (layered ? drawRules(ctx, f) : drawFlow(ctx, f, radius)));
  const logo = drawLogo(ctx, doc, assets, fitted);
  const backdrop = image ? archRect(geo) : null;
  if (backdrop) {
    drawArch(ctx, backdrop, palette.arch);
  }
  if (image && picture) {
    ctx.drawImage(image, picture.x, picture.y, picture.w, picture.h);
  }
  if (layered) {
    flows.forEach((f) => drawMarks(ctx, f, radius));
  }
  return {
    width,
    height,
    picture,
    pictureRegion: region,
    textBoxes: flows.flatMap((f) => f.texts.map((t) => t.box)),
    cardBoxes: body.cards.map((c) => c.rect),
    iconBoxes: flows.flatMap((f) => f.icons.map((i) => i.rect)),
    ruleBoxes: flows.flatMap((f) => f.rules.map((r) => r.rect)),
    logo,
    backdrop,
  };
}
