import type { FlowGroup, FlowLine } from './textFlow';

export const LINE_HEIGHT = 1.2;
export const BULLET_INDENT = 1.1;
const ICON_SCALE = 1.6;
const ICON_GAP = 0.35;

export interface Measured {
  group: FlowGroup;
  widths: number[];
}

export type SizeTable = Map<Measured, number[]>;

export interface GroupBox {
  pad: number;
  d: number;
  iconIndent: number;
  avail: number;
}

interface Member {
  line: FlowLine;
  width: number;
  cap: number;
  sizes: number[];
  i: number;
}

export const indented = (line: FlowLine): boolean => line.bullet !== undefined || line.hang === true;

const bulletIndent = (line: FlowLine, k: number): number => (indented(line) ? line.size * k * BULLET_INDENT : 0);

const iconSize = (group: FlowGroup, k: number): number => {
  const first = group.lines[0];
  if (group.icon?.size !== undefined) {
    return group.icon.size * k;
  }
  return group.icon && first ? first.size * k * LINE_HEIGHT * ICON_SCALE : 0;
};

/** The card pad, icon size, icon indent and the width left for text of a group in a column. */
export function groupBox(group: FlowGroup, k: number, colW: number): GroupBox {
  const pad = group.card ? group.card.pad * k : 0;
  const d = iconSize(group, k);
  const gap = group.icon?.gap === undefined ? d * ICON_GAP : group.icon.gap * k;
  const iconIndent = d > 0 ? d + gap : 0;
  return { pad, d, iconIndent, avail: colW - 2 * pad - iconIndent };
}

function lineSize(line: FlowLine, width: number, k: number, avail: number): number {
  const indent = bulletIndent(line, k);
  return Math.max(0, Math.min(line.size * k, (line.size * (avail * (line.widthScale ?? 1) - indent)) / Math.max(width, 1)));
}

function groupSizes(m: Measured, k: number, avail: number): number[] {
  const own = m.group.lines.map((line, i) => lineSize(line, m.widths[i] ?? 1, k, avail));
  if (!m.group.uniform) {
    return own;
  }
  const ratio = Math.min(...m.group.lines.map((line, i) => (own[i] ?? 0) / line.size));
  return m.group.lines.map((line) => line.size * ratio);
}

function tieMembers(all: Measured[], k: number, colW: number, table: SizeTable, pick: (line: FlowLine) => number | undefined): Member[][] {
  const byId = new Map<number, Member[]>();
  all.forEach((m) => {
    const { avail } = groupBox(m.group, k, colW);
    const sizes = table.get(m) ?? [];
    m.group.lines.forEach((line, i) => {
      const id = pick(line);
      if (id !== undefined) {
        const member = { line, width: Math.max(m.widths[i] ?? 1, 1), cap: Math.max(0, avail * (line.widthScale ?? 1) - bulletIndent(line, k)), sizes, i };
        byId.set(id, [...(byId.get(id) ?? []), member]);
      }
    });
  });
  return [...byId.values()].filter((list) => list.length > 1);
}

function sameSizes(list: Member[]): void {
  const target = Math.min(Math.max(...list.map((x) => x.sizes[x.i] ?? 0)), ...list.map((x) => (x.line.size * x.cap) / x.width));
  list.forEach((x) => {
    x.sizes[x.i] = target;
  });
}

function sameWidths(list: Member[]): void {
  const drawn = list.map((x) => (x.width * (x.sizes[x.i] ?? 0)) / x.line.size);
  const target = Math.min(Math.max(...drawn), ...list.map((x) => x.cap));
  list.forEach((x) => {
    x.sizes[x.i] = (target * x.line.size) / x.width;
  });
}

/** Line font sizes at fit factor k; tied lines grow to the larger size or width, never past the column. */
export function sizeTable(all: Measured[], k: number, colW: number): SizeTable {
  const table: SizeTable = new Map(all.map((m) => [m, groupSizes(m, k, groupBox(m.group, k, colW).avail)]));
  tieMembers(all, k, colW, table, (line) => line.sizeTie).forEach(sameSizes);
  tieMembers(all, k, colW, table, (line) => line.widthTie).forEach(sameWidths);
  return table;
}
