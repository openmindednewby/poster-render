import { RowIcon } from '../enums/RowIcon';
import type { PosterContext, Rect } from '../types';
import { disc, polygon, turnedRect, type Point } from './shapes';

export interface IconColors {
  fill: string;
  glyph: string;
}

const LINE = 0.03;
const HEAD_Y = -0.15;
const HEAD_R = 0.1;
const BODY_Y = 0.25;
const BODY_R = 0.2;
const BACK_DX = 0.12;
const BACK_DY = -0.04;
const FRONT_DX = -0.08;
const PAIR_SCALE = 0.85;
const TICKET_W = 0.52;
const TICKET_H = 0.3;
const TICKET_TURN = -Math.PI / 4;
const PERFORATION = 0.14;
const DOTS = [-0.3, 0, 0.3];
const DOT = 0.035;

function halfDisc(ctx: PosterContext, c: Point, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(c[0], c[1], Math.max(0, r), Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

function person(ctx: PosterContext, c: Point, d: number, colors: IconColors): void {
  const w = d * LINE;
  const head: Point = [c[0], c[1] + d * HEAD_Y];
  disc(ctx, head, d * HEAD_R, colors.glyph);
  disc(ctx, head, d * HEAD_R - w, colors.fill);
  halfDisc(ctx, [c[0], c[1] + d * BODY_Y], d * BODY_R, colors.glyph);
  halfDisc(ctx, [c[0], c[1] + d * BODY_Y - w], d * BODY_R - 2 * w, colors.fill);
}

function people(ctx: PosterContext, c: Point, d: number, colors: IconColors): void {
  const s = d * PAIR_SCALE;
  person(ctx, [c[0] + d * BACK_DX, c[1] + d * BACK_DY], s, colors);
  person(ctx, [c[0] + d * FRONT_DX, c[1]], s, colors);
}

function ticket(ctx: PosterContext, c: Point, d: number, colors: IconColors): void {
  const w = d * LINE;
  ctx.fillStyle = colors.glyph;
  polygon(ctx, turnedRect(c, { w: d * TICKET_W, h: d * TICKET_H }, TICKET_TURN));
  ctx.fillStyle = colors.fill;
  polygon(ctx, turnedRect(c, { w: d * TICKET_W - 2 * w, h: d * TICKET_H - 2 * w }, TICKET_TURN));
  const along: Point = [Math.cos(TICKET_TURN), Math.sin(TICKET_TURN)];
  const across: Point = [-along[1], along[0]];
  const x = d * PERFORATION;
  DOTS.forEach((t) => disc(ctx, [c[0] + along[0] * x + across[0] * t * d * TICKET_H, c[1] + along[1] * x + across[1] * t * d * TICKET_H], d * DOT, colors.glyph));
}

const GLYPHS: Record<RowIcon, (ctx: PosterContext, c: Point, d: number, colors: IconColors) => void> = {
  [RowIcon.Person]: person,
  [RowIcon.People]: people,
  [RowIcon.Ticket]: ticket,
};

/** Draws a filled disc with a line icon (person, two people or a turned ticket) in the glyph colour. */
export function drawRowIcon(ctx: PosterContext, r: Rect, kind: RowIcon, colors: IconColors): void {
  const c: Point = [r.x + r.w / 2, r.y + r.h / 2];
  disc(ctx, c, r.w / 2, colors.fill);
  GLYPHS[kind](ctx, c, r.w, colors);
}
