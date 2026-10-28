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
  ruleBelow?: boolean;
  uniform?: boolean;
  icon?: { color: string; glyph: string };
  keepWithNext?: boolean;
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
  icons: { rect: Rect; color: string; glyph: string }[];
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
const TWO_COLUMN_MIN = 0.75;
const TWO_COLUMN_GAIN = 1.15;
const MIN_K = 0.02;
const STEPS = 22;
const ICON_SCALE = 1.6;
const ICON_GAP = 0.35;

export const fontOf = (line: FlowLine, size: number, fonts: FontSet): string => `${line.weight} ${size}px ${fonts[line.role]}`;

export const emptyFlow = (): FlowResult => ({ texts: [], cards: [], rules: [], bullets: [], icons: [] });

const iconSize = (group: FlowGroup, k: number): number => {
  const first = group.lines[0];
  return group.icon && first ? first.size * k * LINE_HEIGHT * ICON_SCALE : 0;
};

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

function placeIcon(group: FlowGroup, d: number, x: number, textTop: number, textBottom: number, out: FlowResult | null): number {
  if (!group.icon || d <= 0) {
    return textBottom;
  }
  const textH = textBottom - textTop;
  out?.icons.push({ rect: { x, y: textTop + Math.max(0, (textH - d) / 2), w: d, h: d }, color: group.icon.color, glyph: group.icon.glyph });
  return textTop + Math.max(textH, d);
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
  const d = iconSize(group, k);
  const iconIndent = d > 0 ? d * (1 + ICON_GAP) : 0;
  const avail = col.w - 2 * pad - iconIndent;
  const ratio = groupRatio(m, k, avail);
  group.lines.forEach((line, i) => {
    const size = ratio === null ? lineSize(line, m.widths[i] ?? 1, k, avail) : line.size * ratio;
    const indent = (line.bullet ? line.size * k * BULLET_INDENT : 0) + iconIndent;
    const w = ((m.widths[i] ?? 0) * size) / line.size;
    const x = col.right ? col.x + col.w - pad - w : col.x + pad + indent;
    out?.texts.push({ text: line.text, font: '', color: line.color, box: { x, y, w, h: size * LINE_HEIGHT } });
    if (line.bullet && out) {
      out.bullets.push({ x: col.x + pad + size * BULLET_RADIUS, y: y + (size * LINE_HEIGHT) / 2, r: size * BULLET_RADIUS, color: line.bullet });
    }
    y += size * LINE_HEIGHT;
  });
  y = placeIcon(group, d, col.x + pad, top + pad, y, out);
  y += pad;
  if (group.rule && group.ruleBelow) {
    y += group.rule.height * k * (RULE_GAP - 1);
    out?.rules.push({ rect: { x: col.x, y, w: col.w * RULE_WIDTH, h: group.rule.height * k }, color: group.rule.color });
    y += group.rule.height * k;
  }
  if (group.card) {
    out?.cards.unshift({ rect: { x: col.x, y: top, w: col.w, h: y - top }, color: group.card.color });
  }
  return y + group.gapAfter * k - y0;
}

function placeColumn(groups: Measured[], k: number, col: FlowZone, out: FlowResult | null, spread = 0): number {
  let h = 0;
  for (const g of groups) {
    h += placeGroup(g, k, col, col.y + h, out) + spread;
  }
  return h - spread;
}

const columnSum = (heights: number[], from: number, to: number): number => heights.slice(from, to).reduce((a, b) => a + b, 0);

const tallest = (heights: number[], cut: number): number => {
  const left = heights.slice(0, cut).reduce((a, b) => a + b, 0);
  const right = heights.slice(cut).reduce((a, b) => a + b, 0);
  return Math.max(left, right);
};

function keepTogether(groups: Measured[], heights: number[], cut: number): number {
  const breaks = (c: number): boolean => groups[c - 1]?.group.keepWithNext === true;
  let back = cut;
  while (back > 1 && breaks(back)) {back--;}
  let fwd = cut;
  while (fwd < groups.length - 1 && breaks(fwd)) {fwd++;}
  const candidates = [back, fwd].filter((c) => !breaks(c));
  if (candidates.length === 0) {
    return cut;
  }
  return candidates.reduce((best, c) => (tallest(heights, c) < tallest(heights, best) ? c : best));
}

type Columns = { col: FlowZone; groups: Measured[] }[];

function splitColumns(groups: Measured[], zone: FlowZone): Columns {
  const gap = Math.round(zone.w * 0.04);
  const w = (zone.w - gap) / 2;
  const heights = groups.map((g) => placeGroup(g, 1, { ...zone, w }, 0, null));
  const total = columnSum(heights, 0, heights.length);
  let cut = 1;
  for (let c = 2; c < groups.length; c++) {
    if (Math.abs(total - 2 * columnSum(heights, 0, c)) < Math.abs(total - 2 * columnSum(heights, 0, cut))) {
      cut = c;
    }
  }
  cut = keepTogether(groups, heights, cut);
  return [
    { col: { ...zone, w }, groups: groups.slice(0, cut) },
    { col: { ...zone, x: zone.x + w + gap, w }, groups: groups.slice(cut) },
  ];
}

function largestK(columns: Columns, zoneH: number): number {
  const fits = (k: number): boolean => columns.every((c) => placeColumn(c.groups, k, c.col, null) <= zoneH);
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
  return lo;
}

function bestColumns(measured: Measured[], zone: FlowZone): { columns: Columns; k: number } {
  const single: Columns = [{ col: zone, groups: measured }];
  const k1 = largestK(single, zone.h);
  if (measured.length < 2 || zone.w / Math.max(zone.h, 1) < TWO_COLUMN_MIN) {
    return { columns: single, k: k1 };
  }
  const split = splitColumns(measured, zone);
  const k2 = largestK(split, zone.h);
  const forced = zone.w / Math.max(zone.h, 1) > WIDE;
  return forced || k2 > k1 * TWO_COLUMN_GAIN ? { columns: split, k: k2 } : { columns: single, k: k1 };
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
  const { columns, k: lo } = bestColumns(measured, zone);
  const out = emptyFlow();
  const heights = columns.map((c) => placeColumn(c.groups, lo, c.col, null));
  const end = Math.max(...heights);
  columns.forEach((c, i) => placeColumn(c.groups, lo, c.col, out, c.groups.length > 1 && columns.length > 1 ? (end - (heights[i] ?? end)) / (c.groups.length - 1) : 0));
  const lines = groups.flatMap((g) => g.lines);
  out.texts.forEach((t, i) => {
    const line = lines[i];
    t.font = line ? fontOf(line, t.box.h / LINE_HEIGHT, fonts) : t.font;
  });
  return out;
}
