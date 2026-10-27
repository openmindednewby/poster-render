import { LayoutId } from '../enums/LayoutId';
import type { FlierDoc, ListItem, Palette } from '../types';
import type { FlowGroup, FlowLine } from './textFlow';

const BOLD = 700;
const SEMI = 600;
const MEDIUM = 500;
const SCRIPT = 400;

type Line = (text: string, size: number) => FlowLine;

const makers = (p: Palette, u: number): Record<string, Line> => ({
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
  const lines = [l.display?.(b.title, 250), b.script ? l.script?.(b.script, 120) : undefined, b.titleBottom ? l.display?.(b.titleBottom, 250) : undefined];
  return [{ lines: lines.filter((x): x is FlowLine => x !== undefined), gapAfter: 0 }];
}

function itemGroup(item: ListItem, l: Record<string, Line>, u: number): FlowGroup {
  const lines: FlowLine[] = [l.script?.(item.date, 96) as FlowLine];
  item.schedule.forEach((row) => lines.push(l.strong?.(`${row.label}  ${row.time}`, 42) as FlowLine));
  if (item.price) {
    lines.push(l.accent?.(item.price, 42) as FlowLine);
  }
  return { lines, gapAfter: 26 * u };
}

function eventGroups(doc: FlierDoc, l: Record<string, Line>, u: number, withPrices: boolean): FlowGroup[] {
  const b = doc.blocks;
  const groups: FlowGroup[] = [];
  b.schedule?.forEach((row) => groups.push({ lines: [l.strong?.(row.label, 66) as FlowLine, l.accent?.(row.time, 60) as FlowLine], gapAfter: 30 * u }));
  (withPrices ? b.prices : undefined)?.forEach((row) => groups.push({ lines: [l.strong?.(row.amount, 66) as FlowLine, l.accent?.(row.label, 52) as FlowLine], gapAfter: 30 * u }));
  return groups;
}

function listGroups(doc: FlierDoc, l: Record<string, Line>, u: number): FlowGroup[] {
  const groups = (doc.items ?? []).map((item) => itemGroup(item, l, u));
  const prices = doc.blocks.prices?.map((row) => l.strong?.(`${row.amount} ${row.label}`, 58) as FlowLine) ?? [];
  if (prices.length > 0) {
    groups.push({ lines: prices, gapAfter: 30 * u });
  }
  return groups;
}

/** Price groups set large for the flank zones beside an arch. */
export function flankPriceGroups(doc: FlierDoc, p: Palette, u: number): FlowGroup[] {
  const l = makers(p, u);
  return (doc.blocks.prices ?? []).map((row) => ({ lines: [l.strong?.(row.amount, 110) as FlowLine, l.accent?.(row.label, 48) as FlowLine], gapAfter: 30 * u }));
}

/** Turns the doc's body blocks into flow groups: venue, schedule or list items, prices, includes card, footer. */
export function bodyGroups(doc: FlierDoc, p: Palette, u: number, withPrices = true): FlowGroup[] {
  const l = makers(p, u);
  const b = doc.blocks;
  const groups: FlowGroup[] = [];
  const isList = doc.layout === LayoutId.List;
  if (b.venue) {
    groups.push({ lines: b.venue.map((v) => l.venue?.(v, isList ? 48 : 58) as FlowLine), gapAfter: 40 * u, rule: { color: p.accent, height: 8 * u } });
  }
  groups.push(...(isList ? listGroups(doc, l, u) : eventGroups(doc, l, u, withPrices)));
  if (b.includes) {
    const lines = [l.accent?.(b.includes.heading, 38) as FlowLine, ...b.includes.items.map((i) => l.item?.(i, 38) as FlowLine)];
    groups.push({ lines, gapAfter: 24 * u, card: { color: p.card, pad: 28 * u }, uniform: true });
  }
  if (b.footer) {
    groups.push({ lines: [l.soft?.(b.footer, 34) as FlowLine], gapAfter: 0 });
  }
  return groups;
}
