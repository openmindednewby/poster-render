import type { FontSet, PosterContext, Rect } from '../types';

export interface FlowLine {
  text: string;
  role: keyof FontSet;
  weight: number;
  size: number;
  color: string;
  bullet?: string;
}

export interface FlowGroup {
  lines: FlowLine[];
  gapAfter: number;
  card?: { color: string; pad: number };
  rule?: { color: string; height: number };
  uniform?: boolean;
}

export interface FlowZone extends Rect {
  right?: boolean;
}

export interface TextOp {
  text: string;
  font: string;
  color: string;
  box: Rect;
}

export interface FlowResult {
  texts: TextOp[];
  cards: { rect: Rect; color: string }[];
  rules: { rect: Rect; color: string }[];
  bullets: { x: number; y: number; r: number; color: string }[];
}

interface Measured {
  group: FlowGroup;
  widths: number[];
}

const LINE_HEIGHT = 1.2;
const BULLET_INDENT = 1.1;
const BULLET_RADIUS = 0.2;
const RULE_GAP = 2.5;
const RULE_WIDTH = 0.9;
const WIDE = 1.6;
const MIN_K = 0.02;
const STEPS = 22;

export const fontOf = (line: FlowLine, size: number, fonts: FontSet): string => `${line.weight} ${size}px ${fonts[line.role]}`;

export const emptyFlow = (): FlowResult => ({ texts: [], cards: [], rules: [], bullets: [] });

function lineSize(line: FlowLine, width: number, k: number, avail: number): number {
  const indent = line.bullet ? line.size * k * BULLET_INDENT : 0;
  return Math.max(0, Math.min(line.size * k, (line.size * (avail - indent)) / Math.max(width, 1)));
}

function groupRatio(m: Measured, k: number, avail: number): number | null {
  if (!m.group.uniform) {
    return null;
  }
  return Math.min(...m.group.lines.map((line, i) => lineSize(line, m.widths[i] ?? 1, k, avail) / line.size));
}

function placeGroup(m: Measured, k: number, col: FlowZone, y0: number, out: FlowResult | null): number {
  const { group } = m;
  let y = y0;
  if (group.rule) {
    out?.rules.push({ rect: { x: col.x, y, w: col.w * RULE_WIDTH, h: group.rule.height * k }, color: group.rule.color });
    y += group.rule.height * k * RULE_GAP;
  }
  const pad = group.card ? group.card.pad * k : 0;
  const top = y;
  y += pad;
  const ratio = groupRatio(m, k, col.w - 2 * pad);
  group.lines.forEach((line, i) => {
    const size = ratio === null ? lineSize(line, m.widths[i] ?? 1, k, col.w - 2 * pad) : line.size * ratio;
    const indent = line.bullet ? line.size * k * BULLET_INDENT : 0;
    const w = ((m.widths[i] ?? 0) * size) / line.size;
    const x = col.right ? col.x + col.w - pad - w : col.x + pad + indent;
    out?.texts.push({ text: line.text, font: '', color: line.color, box: { x, y, w, h: size * LINE_HEIGHT } });
    if (line.bullet && out) {
      out.bullets.push({ x: col.x + pad + size * BULLET_RADIUS, y: y + (size * LINE_HEIGHT) / 2, r: size * BULLET_RADIUS, color: line.bullet });
    }
    y += size * LINE_HEIGHT;
  });
  y += pad;
  if (group.card) {
    out?.cards.unshift({ rect: { x: col.x, y: top, w: col.w, h: y - top }, color: group.card.color });
  }
  return y + group.gapAfter * k - y0;
}

function placeColumn(groups: Measured[], k: number, col: FlowZone, out: FlowResult | null): number {
  let h = 0;
  for (const g of groups) {
    h += placeGroup(g, k, col, col.y + h, out);
  }
  return h;
}

function splitColumns(groups: Measured[], zone: FlowZone): { col: FlowZone; groups: Measured[] }[] {
  if (zone.w / Math.max(zone.h, 1) <= WIDE || groups.length < 2) {
    return [{ col: zone, groups }];
  }
  const heights = groups.map((g) => placeGroup(g, 1, zone, 0, null));
  const half = heights.reduce((a, b) => a + b, 0) / 2;
  let acc = 0;
  let cut = 1;
  heights.forEach((h, i) => {
    if (acc < half) {
      cut = i + 1;
    }
    acc += h;
  });
  cut = Math.min(cut, groups.length - 1);
  const gap = Math.round(zone.w * 0.04);
  const w = (zone.w - gap) / 2;
  return [
    { col: { ...zone, w }, groups: groups.slice(0, cut) },
    { col: { ...zone, x: zone.x + w + gap, w }, groups: groups.slice(cut) },
  ];
}

/** Lays groups out in the zone, shrinking every size by one factor until all text fits; never overflows. */
export function flow(ctx: PosterContext, groups: FlowGroup[], zone: FlowZone, fonts: FontSet): FlowResult {
  const measured = groups.map((group) => ({
    group,
    widths: group.lines.map((line) => {
      ctx.font = fontOf(line, line.size, fonts);
      return ctx.measureText(line.text).width;
    }),
  }));
  const columns = splitColumns(measured, zone);
  const fits = (k: number): boolean => columns.every((c) => placeColumn(c.groups, k, c.col, null) <= zone.h);
  let lo = MIN_K;
  let hi = 1;
  if (fits(1)) {
    lo = 1;
  }
  for (let i = 0; i < STEPS && lo < hi; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  const out = emptyFlow();
  columns.forEach((c) => placeColumn(c.groups, lo, c.col, out));
  const lines = groups.flatMap((g) => g.lines);
  out.texts.forEach((t, i) => {
    const line = lines[i];
    t.font = line ? fontOf(line, t.box.h / LINE_HEIGHT, fonts) : t.font;
  });
  return out;
}
