import { LayoutId } from '../enums/LayoutId';
import type { FlierDoc, ListItem, Palette } from '../types';
import type { FlowGroup, FlowLine } from './textFlow';

const BOLD = 700;
const SEMI = 600;
const MEDIUM = 500;
const SCRIPT = 400;

const SIZE = {
  title: 250,
  headerScript: 120,
  itemDate: 67,
  itemRow: 42,
  scheduleLabel: 66,
  scheduleTime: 60,
  priceAmount: 66,
  priceLabel: 52,
  listPrice: 58,
  flankAmount: 110,
  flankLabel: 48,
  venue: 58,
  listVenue: 48,
  small: 38,
} as const;

const GAP = {
  item: 48,
  row: 30,
  venue: 40,
  includes: 24,
  rule: 8,
} as const;

type Line = (text: string, size: number) => FlowLine;

interface Makers {
  display: Line;
  venue: Line;
  script: Line;
  strong: Line;
  accent: Line;
  item: Line;
  soft: Line;
}

const makers = (p: Palette, u: number): Makers => ({
  display: (text, size) => ({ text, role: 'display', weight: BOLD, size: size * u, color: p.title }),
  venue: (text, size) => ({ text, role: 'display', weight: MEDIUM, size: size * u, color: p.ink }),
  script: (text, size) => ({ text, role: 'script', weight: SCRIPT, size: size * u, color: p.accent }),
  strong: (text, size) => ({ text, role: 'body', weight: BOLD, size: size * u, color: p.ink }),
  accent: (text, size) => ({ text, role: 'body', weight: SEMI, size: size * u, color: p.accent }),
  item: (text, size) => ({ text, role: 'body', weight: SEMI, size: size * u, color: p.ink, bullet: p.accent }),
  soft: (text, size) => ({ text, role: 'body', weight: MEDIUM, size: size * u, color: p.soft }),
});

export function headerGroups(doc: FlierDoc, p: Palette, u: number): FlowGroup[] {
  const l = makers(p, u);
  const b = doc.blocks;
  const lines = [l.display(b.title, SIZE.title), b.script ? l.script(b.script, SIZE.headerScript) : undefined, b.titleBottom ? l.display(b.titleBottom, SIZE.title) : undefined];
  return [{ lines: lines.filter((x): x is FlowLine => x !== undefined), gapAfter: 0 }];
}

function itemGroup(item: ListItem, l: Makers, u: number): FlowGroup {
  const lines: FlowLine[] = [l.script(item.date, SIZE.itemDate)];
  item.schedule.forEach((row) => lines.push(l.strong(`${row.label}  ${row.time}`, SIZE.itemRow)));
  if (item.price) {
    lines.push(l.accent(item.price, SIZE.itemRow));
  }
  return { lines, gapAfter: GAP.item * u };
}

export interface BodyOptions {
  withPrices?: boolean;
  compact?: boolean;
  wrap?: boolean;
}

const WRAP_FROM = 14;

function halves(text: string): string[] {
  const mid = text.length / 2;
  const spaces = [...text].flatMap((c, i) => (c === ' ' ? [i] : []));
  if (text.length < WRAP_FROM || spaces.length === 0) {
    return [text];
  }
  const cut = spaces.reduce((best, i) => (Math.abs(i - mid) < Math.abs(best - mid) ? i : best));
  return [text.slice(0, cut), text.slice(cut + 1)];
}

function wrapped(line: FlowLine, wrap: boolean | undefined): FlowLine[] {
  const parts = wrap ? halves(line.text) : [line.text];
  return parts.map((text, i) => (i === 0 ? { ...line, text } : { ...line, text, bullet: undefined, hang: line.bullet !== undefined }));
}

function eventGroups(doc: FlierDoc, l: Makers, u: number, options: BodyOptions): FlowGroup[] {
  const b = doc.blocks;
  const groups: FlowGroup[] = [];
  const schedule = b.schedule ?? [];
  schedule.forEach((row, i) => {
    const lines = options.compact ? [l.strong(`${row.label}  ${row.time}`, SIZE.scheduleLabel)] : [l.strong(row.label, SIZE.scheduleLabel), l.accent(row.time, SIZE.scheduleTime)];
    groups.push({ lines, gapAfter: GAP.row * u, keepWithNext: i < schedule.length - 1 });
  });
  const prices = (options.withPrices === false ? undefined : b.prices) ?? [];
  prices.forEach((row, i) => {
    const lines = options.compact ? [l.strong(`${row.amount} ${row.label}`, SIZE.priceAmount)] : [l.strong(row.amount, SIZE.priceAmount), l.accent(row.label, SIZE.priceLabel)];
    groups.push({ lines, gapAfter: GAP.row * u, keepWithNext: i < prices.length - 1 });
  });
  return groups;
}

function listGroups(doc: FlierDoc, l: Makers, u: number): FlowGroup[] {
  const groups = (doc.items ?? []).map((item) => itemGroup(item, l, u));
  const prices = doc.blocks.prices?.map((row) => l.strong(`${row.amount} ${row.label}`, SIZE.listPrice)) ?? [];
  if (prices.length > 0) {
    groups.push({ lines: prices, gapAfter: GAP.row * u });
  }
  return groups;
}

/** Price groups set large for the flank zones beside an arch. */
export function flankPriceGroups(doc: FlierDoc, p: Palette, u: number): FlowGroup[] {
  const l = makers(p, u);
  return (doc.blocks.prices ?? []).map((row) => ({ lines: [l.strong(row.amount, SIZE.flankAmount), l.accent(row.label, SIZE.flankLabel)], gapAfter: GAP.row * u }));
}

/** Turns the doc's body blocks into flow groups: venue with its pin, schedule or list items, prices, includes, footer; compact sets each schedule and price row on one line. */
export function bodyGroups(doc: FlierDoc, p: Palette, u: number, options: BodyOptions = {}): FlowGroup[] {
  const l = makers(p, u);
  const b = doc.blocks;
  const groups: FlowGroup[] = [];
  const isList = doc.layout === LayoutId.List;
  if (b.venue) {
    const size = isList ? SIZE.listVenue : SIZE.venue;
    const keepWithNext = !isList && (b.schedule?.length ?? 0) > 0;
    groups.push({ lines: b.venue.map((v) => l.venue(v, size)), gapAfter: GAP.venue * u, rule: { color: p.accent, height: GAP.rule * u }, ruleBelow: true, icon: { color: p.accent, glyph: p.background }, keepWithNext });
  }
  groups.push(...(isList ? listGroups(doc, l, u) : eventGroups(doc, l, u, options)));
  if (b.includes) {
    const lines = [l.accent(b.includes.heading, SIZE.small), ...b.includes.items.map((i) => l.item(i, SIZE.small))].flatMap((line) => wrapped(line, options.wrap));
    groups.push({ lines, gapAfter: GAP.includes * u, uniform: true });
  }
  if (b.footer) {
    groups.push({ lines: wrapped(l.soft(b.footer, SIZE.small), options.wrap), gapAfter: 0 });
  }
  return groups;
}
