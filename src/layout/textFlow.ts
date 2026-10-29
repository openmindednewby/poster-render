import { LineAlign } from '../enums/LineAlign';
import type { FontSet, PosterContext, Rect } from '../types';
import { BULLET_INDENT, LINE_HEIGHT, groupBox, indented, sizeTable, type Measured, type SizeTable } from './lineSizes';

export interface FlowLine {
  text: string;
  role: keyof FontSet;
  weight: number;
  size: number;
  color: string;
  bullet?: string;
  hang?: boolean;
  family?: string;
  italic?: boolean;
  spacing?: number;
  align?: LineAlign;
  widthTie?: number;
  sizeTie?: number;
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
  attachNext?: boolean;
}

export interface FlowZone extends Rect {
  right?: boolean;
}

export interface TextOp {
  text: string;
  font: string;
  color: string;
  box: Rect;
  spacing?: string;
}

export interface FlowResult {
  texts: TextOp[];
  cards: { rect: Rect; color: string }[];
  rules: { rect: Rect; color: string }[];
  bullets: { x: number; y: number; r: number; color: string }[];
  icons: { rect: Rect; color: string; glyph: string }[];
}

const BULLET_RADIUS = 0.2;
const RULE_GAP = 2.5;
const RULE_WIDTH = 0.9;
const WIDE = 1.6;
const COLUMN_GAP = 0.04;
const TWO_COLUMN_MIN = 0.75;
const TWO_COLUMN_GAIN = 1.15;
const MIN_K = 0.02;
const STEPS = 22;
const NO_SPACING = '0px';

export const fontOf = (line: FlowLine, size: number, fonts: FontSet): string => {
  const family = line.family === undefined ? fonts[line.role] : `"${line.family}", ${fonts[line.role]}`;
  return `${line.italic === true ? 'italic ' : ''}${line.weight} ${size}px ${family}`;
};

export const emptyFlow = (): FlowResult => ({ texts: [], cards: [], rules: [], bullets: [], icons: [] });

interface IconBox {
  d: number;
  x: number;
  top: number;
  bottom: number;
}

interface GroupPlace {
  k: number;
  col: FlowZone;
  y0: number;
  sizes: number[];
}

interface ColumnPlace {
  k: number;
  col: FlowZone;
  table: SizeTable;
  spread?: number;
}

interface LineBox {
  col: FlowZone;
  pad: number;
  indent: number;
  w: number;
}

function lineX(line: FlowLine, box: LineBox): number {
  const { col, pad, indent, w } = box;
  const left = col.x + pad + indent;
  const right = col.x + col.w - pad - w;
  switch (line.align) {
    case LineAlign.Left:
      return left;
    case LineAlign.Right:
      return right;
    case LineAlign.Center:
      return left + (right - left) / 2;
    default:
      return col.right ? right : left;
  }
}

function placeIcon(group: FlowGroup, box: IconBox, out: FlowResult | null): number {
  const { d, x, top, bottom } = box;
  if (!group.icon || d <= 0) {
    return bottom;
  }
  const textH = bottom - top;
  out?.icons.push({ rect: { x, y: top + Math.max(0, (textH - d) / 2), w: d, h: d }, color: group.icon.color, glyph: group.icon.glyph });
  return top + Math.max(textH, d);
}

function placeGroup(m: Measured, at: GroupPlace, out: FlowResult | null): number {
  const { k, col, y0, sizes } = at;
  const { group } = m;
  let y = y0;
  if (group.rule) {
    out?.rules.push({ rect: { x: col.x, y, w: col.w * RULE_WIDTH, h: group.rule.height * k }, color: group.rule.color });
    y += group.rule.height * k * RULE_GAP;
  }
  const { pad, d, iconIndent } = groupBox(group, k, col.w);
  const top = y;
  y += pad;
  group.lines.forEach((line, i) => {
    const size = sizes[i] ?? 0;
    const indent = (indented(line) ? line.size * k * BULLET_INDENT : 0) + iconIndent;
    const w = ((m.widths[i] ?? 0) * size) / line.size;
    const x = lineX(line, { col, pad, indent, w });
    out?.texts.push({ text: line.text, font: '', color: line.color, box: { x, y, w, h: size * LINE_HEIGHT } });
    if (line.bullet && out) {
      out.bullets.push({ x: col.x + pad + size * BULLET_RADIUS, y: y + (size * LINE_HEIGHT) / 2, r: size * BULLET_RADIUS, color: line.bullet });
    }
    y += size * LINE_HEIGHT;
  });
  y = placeIcon(group, { d, x: col.x + pad, top: top + pad, bottom: y }, out);
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

function placeColumn(groups: Measured[], at: ColumnPlace, out: FlowResult | null): number {
  const { k, col, table, spread = 0 } = at;
  let h = 0;
  groups.forEach((g, i) => {
    h += placeGroup(g, { k, col, y0: col.y + h, sizes: table.get(g) ?? [] }, out);
    if (i < groups.length - 1 && g.group.attachNext !== true) {
      h += spread;
    }
  });
  return h;
}

const spreadGaps = (groups: Measured[]): number => groups.slice(0, -1).filter((g) => g.group.attachNext !== true).length;

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
  const gap = Math.round(zone.w * COLUMN_GAP);
  const w = (zone.w - gap) / 2;
  const table = sizeTable(groups, 1, w);
  const heights = groups.map((g) => placeGroup(g, { k: 1, col: { ...zone, w }, y0: 0, sizes: table.get(g) ?? [] }, null));
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

const tableFor = (columns: Columns, k: number): SizeTable => sizeTable(columns.flatMap((c) => c.groups), k, columns[0]?.col.w ?? 0);

function largestK(columns: Columns, zoneH: number): number {
  const fits = (k: number): boolean => {
    const table = tableFor(columns, k);
    return columns.every((c) => placeColumn(c.groups, { k, col: c.col, table }, null) <= zoneH);
  };
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

function measure(ctx: PosterContext, line: FlowLine, fonts: FontSet): number {
  ctx.font = fontOf(line, line.size, fonts);
  if (line.spacing === undefined) {
    return ctx.measureText(line.text).width;
  }
  ctx.letterSpacing = `${line.spacing * line.size}px`;
  const width = ctx.measureText(line.text).width;
  ctx.letterSpacing = NO_SPACING;
  return width;
}

/** Lays groups out in the zone, shrinking every size by one factor until all text fits; never overflows. */
export function flow(ctx: PosterContext, groups: FlowGroup[], zone: FlowZone, fonts: FontSet): FlowResult {
  const measured = groups.map((group) => ({
    group,
    widths: group.lines.map((line) => measure(ctx, line, fonts)),
  }));
  const { columns, k: lo } = bestColumns(measured, zone);
  const out = emptyFlow();
  const table = tableFor(columns, lo);
  const heights = columns.map((c) => placeColumn(c.groups, { k: lo, col: c.col, table }, null));
  const end = Math.max(...heights);
  columns.forEach((c, i) => {
    const gaps = spreadGaps(c.groups);
    placeColumn(c.groups, { k: lo, col: c.col, table, spread: gaps > 0 && columns.length > 1 ? (end - (heights[i] ?? end)) / gaps : 0 }, out);
  });
  const lines = groups.flatMap((g) => g.lines);
  out.texts.forEach((t, i) => {
    const line = lines[i];
    t.font = line ? fontOf(line, t.box.h / LINE_HEIGHT, fonts) : t.font;
    if (line?.spacing !== undefined) {
      t.spacing = `${line.spacing * (t.box.h / LINE_HEIGHT)}px`;
    }
  });
  return out;
}
