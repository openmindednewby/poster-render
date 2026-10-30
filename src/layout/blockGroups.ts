import { BodySection } from '../enums/BodySection';
import { LayoutId } from '../enums/LayoutId';
import type { RowIcon } from '../enums/RowIcon';
import type { FlierDoc, ListItem, Palette, RowTheme } from '../types';
import { styleContext, styled, type StyleContext } from './lineStyle';
import { sectionOrderOf } from './sectionOrder';
import type { FlowGroup, FlowLine } from './textFlow';

const BOLD = 700;
const SEMI = 600;
const MEDIUM = 500;
const SCRIPT = 400;
const LABEL_TIE = -1;

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
  divider: 24,
} as const;

type Line = (text: string, size: number, key: string) => FlowLine;

interface Makers {
  display: Line;
  venue: Line;
  bodyVenue: Line;
  script: Line;
  strong: Line;
  accent: Line;
  item: Line;
  soft: Line;
  time: Line;
}

const makers = (p: Palette, u: number, sc: StyleContext, timeWeight = SEMI, bullets = true): Makers => ({
  display: (text, size, key) => styled({ text, role: 'display', weight: BOLD, size: size * u, color: p.title }, key, sc),
  venue: (text, size, key) => styled({ text, role: 'display', weight: MEDIUM, size: size * u, color: p.ink }, key, sc),
  bodyVenue: (text, size, key) => styled({ text, role: 'body', weight: BOLD, size: size * u, color: p.ink }, key, sc),
  script: (text, size, key) => styled({ text, role: 'script', weight: SCRIPT, size: size * u, color: p.script ?? p.accent }, key, sc),
  strong: (text, size, key) => styled({ text, role: 'body', weight: BOLD, size: size * u, color: p.ink }, key, sc),
  accent: (text, size, key) => styled({ text, role: 'body', weight: SEMI, size: size * u, color: p.accent }, key, sc),
  item: (text, size, key) => styled({ text, role: 'body', weight: SEMI, size: size * u, color: p.ink, bullet: bullets ? p.accent : undefined }, key, sc),
  soft: (text, size, key) => styled({ text, role: 'body', weight: MEDIUM, size: size * u, color: p.soft }, key, sc),
  time: (text, size, key) => styled({ text, role: 'body', weight: timeWeight, size: size * u, color: p.accent }, key, sc),
});

export function headerGroups(doc: FlierDoc, p: Palette, u: number): FlowGroup[] {
  const l = makers(p, u, styleContext(doc));
  const b = doc.blocks;
  const t = doc.tuning;
  const gap = (line: FlowLine, after: number | undefined): FlowLine => (after === undefined ? line : { ...line, gapAfter: after * u });
  const spaced = (line: FlowLine): FlowLine => (t?.titleSpacing === undefined || line.spacing !== undefined ? line : { ...line, spacing: t.titleSpacing });
  const title = gap(spaced(l.display(b.title, SIZE.title * (t?.titleScale ?? 1), 'title')), b.script ?? b.titleBottom ? t?.titleScriptGap : undefined);
  const script = b.script ? gap(l.script(b.script, SIZE.headerScript * (t?.scriptScale ?? 1), 'script'), b.titleBottom ? t?.scriptTitleGap : undefined) : undefined;
  const lines = [title, script, b.titleBottom ? spaced(l.display(b.titleBottom, SIZE.title * (t?.titleBottomScale ?? 1), 'titleBottom')) : undefined];
  return [{ lines: lines.filter((x): x is FlowLine => x !== undefined), gapAfter: 0 }];
}

function itemGroup(item: ListItem, n: number, l: Makers, scale: { u: number; dateScale: number }): FlowGroup {
  const { u, dateScale } = scale;
  const lines: FlowLine[] = [l.script(item.date, SIZE.itemDate * dateScale, `items.${n}.date`)];
  item.schedule.forEach((row, m) => lines.push(l.strong(`${row.label}  ${row.time}`, SIZE.itemRow, `items.${n}.schedule.${m}`)));
  if (item.price) {
    lines.push(l.accent(item.price, SIZE.itemRow, `items.${n}.price`));
  }
  return { lines, gapAfter: GAP.item * u };
}

export interface BodyOptions {
  withPrices?: boolean;
  compact?: boolean;
  wrap?: boolean;
  dateScale?: number;
}

const WRAP_FROM = 14;

type RowMarks = (icons: RowIcon[] | undefined, i: number, last: boolean) => Partial<FlowGroup>;

function dividerOf(doc: FlierDoc, p: Palette, u: number): FlowGroup['rule'] {
  const d = doc.rows?.dividers;
  return d === undefined ? undefined : { color: d.color ?? p.rule ?? p.accent, height: d.thickness * u, gap: (d.gap ?? GAP.divider) * u };
}

function rowMarks(doc: FlierDoc, p: Palette, u: number): RowMarks {
  const divider = dividerOf(doc, p, u);
  const size = doc.rows?.icons?.size;
  return (icons, i, last) => {
    const kind = icons === undefined || icons.length === 0 ? undefined : icons[Math.min(i, icons.length - 1)];
    const icon = kind === undefined ? {} : { icon: { color: p.icon ?? p.accent, glyph: p.background, kind, size: size === undefined ? undefined : size * u } };
    return { ...icon, ...(divider === undefined || last ? {} : { rule: divider, ruleBelow: true, ruleAbove: false }) };
  };
}

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
  return parts.length === 1 ? [line] : parts.map((text, i) => (i === 0 ? { ...line, text, tail: undefined } : { ...line, text, tail: undefined, bullet: undefined, hang: line.bullet !== undefined }));
}

function scheduleLines(doc: FlierDoc, l: Makers, row: { label: string; time: string }, i: number): FlowLine[] {
  const r = doc.rows;
  const label = l.strong(row.label, SIZE.scheduleLabel * (r?.labelScale ?? 1), `schedule.${i}.label`);
  const tied = r?.labelScale === undefined ? label : { ...label, sizeTie: label.sizeTie ?? LABEL_TIE };
  return [tied, l.time(row.time, SIZE.scheduleTime * (r?.timeScale ?? 1), `schedule.${i}.time`)];
}

const tailed = (line: FlowLine, key: string, headLength: number): FlowLine => ({ ...line, tail: { key, at: line.text.length - line.text.slice(headLength).trimStart().length } });

const priceAmount = (doc: FlierDoc, line: FlowLine): FlowLine => (doc.rows?.priceGap === undefined ? line : { ...line, gapAfter: doc.rows.priceGap });

function eventGroups(doc: FlierDoc, l: Makers, u: number, options: BodyOptions & { marks: RowMarks }): [FlowGroup[], FlowGroup[]] {
  const b = doc.blocks;
  const rows: FlowGroup[] = [];
  const priced: FlowGroup[] = [];
  const schedule = b.schedule ?? [];
  const prices = (options.withPrices === false ? undefined : b.prices) ?? [];
  const lastRow = schedule.length + prices.length - 1;
  const icons = doc.rows?.icons;
  schedule.forEach((row, i) => {
    const lines = options.compact ? [tailed(l.strong(`${row.label}  ${row.time}`, SIZE.scheduleLabel, `schedule.${i}.label`), `schedule.${i}.time`, row.label.length)] : scheduleLines(doc, l, row, i);
    rows.push({ lines, gapAfter: GAP.row * u, keepWithNext: i < schedule.length - 1, ...options.marks(icons?.schedule, i, i === lastRow) });
  });
  prices.forEach((row, i) => {
    const lines = options.compact ? [tailed(l.strong(`${row.amount} ${row.label}`, SIZE.priceAmount, `prices.${i}.amount`), `prices.${i}.label`, row.amount.length)] : [priceAmount(doc, l.strong(row.amount, SIZE.priceAmount, `prices.${i}.amount`)), l.accent(row.label, SIZE.priceLabel * (doc.rows?.priceLabelScale ?? 1), `prices.${i}.label`)];
    priced.push({ lines, gapAfter: GAP.row * u, keepWithNext: i < prices.length - 1, ...options.marks(icons?.prices, i, schedule.length + i === lastRow) });
  });
  return [rows, priced];
}

function listGroups(doc: FlierDoc, l: Makers, u: number, dateScale: number): [FlowGroup[], FlowGroup[]] {
  const groups = (doc.items ?? []).map((item, n) => itemGroup(item, n, l, { u, dateScale }));
  const prices = doc.blocks.prices?.map((row, i) => tailed(l.strong(`${row.amount} ${row.label}`, SIZE.listPrice, `prices.${i}.amount`), `prices.${i}.label`, row.amount.length)) ?? [];
  return [groups, prices.length > 0 ? [{ lines: prices, gapAfter: GAP.row * u }] : []];
}

/** Price groups set large for the flank zones beside an arch. */
export function flankPriceGroups(doc: FlierDoc, p: Palette, u: number): FlowGroup[] {
  const l = makers(p, u, styleContext(doc));
  return (doc.blocks.prices ?? []).map((row, i) => ({ lines: [l.strong(row.amount, SIZE.flankAmount, `prices.${i}.amount`), l.accent(row.label, SIZE.flankLabel, `prices.${i}.label`)], gapAfter: GAP.row * u }));
}

function pinOf(look: RowTheme['venue'], u: number): Partial<NonNullable<FlowGroup['icon']>> {
  return { size: look?.pinSize === undefined ? undefined : look.pinSize * u, gap: look?.pinGap === undefined ? undefined : look.pinGap * u, shift: look?.pinShift === undefined ? undefined : look.pinShift * u, centre: look?.centred };
}

type Parts = Record<BodySection, FlowGroup[]>;

function venueGroups(doc: FlierDoc, p: Palette, u: number, l: Makers): FlowGroup[] {
  const b = doc.blocks;
  if (!b.venue) {
    return [];
  }
  const size = doc.layout === LayoutId.List ? SIZE.listVenue : SIZE.venue;
  const look = doc.rows?.venue;
  const line = look?.body === true ? l.bodyVenue : l.venue;
  const venue = look?.oneLine === true ? [b.venue.join(' ')] : b.venue;
  return [{ lines: venue.map((v, i) => line(v, size, `venue.${i}`)), gapAfter: GAP.venue * u, rule: dividerOf(doc, p, u) ?? { color: p.accent, height: GAP.rule * u }, ruleBelow: true, icon: { color: p.icon ?? p.accent, glyph: p.background, bare: look?.bare, ...pinOf(look, u) } }];
}

const bound = (s: BodySection, next: BodySection | undefined): boolean => (s === BodySection.Venue && next === BodySection.Schedule) || (s === BodySection.Includes && next === BodySection.Footer);

function joined(order: BodySection[], parts: Parts): FlowGroup[] {
  const filled = order.filter((s) => parts[s].length > 0);
  return filled.flatMap((s, n) => {
    const groups = parts[s];
    if (!bound(s, filled[n + 1])) {
      return groups;
    }
    const attach = s === BodySection.Includes ? { attachNext: true } : {};
    return groups.map((g, i) => (i === groups.length - 1 ? { ...g, keepWithNext: true, ...attach } : g));
  });
}

/** Turns the doc's body blocks into flow groups in the doc's section order (venue, schedule or list items, prices, includes, footer by default); compact sets each schedule and price row on one line. */
export function bodyGroups(doc: FlierDoc, p: Palette, u: number, options: BodyOptions = {}): FlowGroup[] {
  const l = makers(p, u, styleContext(doc), doc.rows?.timeWeight, doc.bullets !== false);
  const b = doc.blocks;
  const isList = doc.layout === LayoutId.List;
  const [rows, prices] = isList ? listGroups(doc, l, u, options.dateScale ?? 1) : eventGroups(doc, l, u, { ...options, marks: rowMarks(doc, p, u) });
  const includeLines = b.includes ? [l.accent(b.includes.heading, SIZE.small, 'includes.heading'), ...b.includes.items.map((item, i) => l.item(item, SIZE.small, `includes.items.${i}`))] : [];
  const includes = includeLines.length > 0 ? [{ lines: includeLines.flatMap((line) => wrapped(line, options.wrap)), gapAfter: GAP.includes * u, uniform: true }] : [];
  const footerLines = (b.footer ?? '').split('\n').filter((text) => text.trim() !== '');
  const footer = footerLines.length > 0 ? [{ lines: footerLines.flatMap((text) => wrapped(l.soft(text, SIZE.small, 'footer'), options.wrap)), gapAfter: 0 }] : [];
  const parts: Parts = {
    [BodySection.Venue]: venueGroups(doc, p, u, l),
    [BodySection.Schedule]: isList ? [] : rows,
    [BodySection.Items]: isList ? rows : [],
    [BodySection.Prices]: prices,
    [BodySection.Includes]: includes,
    [BodySection.Footer]: footer,
  };
  return joined(sectionOrderOf(doc), parts);
}
