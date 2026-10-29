import type { BackgroundStyle } from './enums/BackgroundStyle';
import type { FontSetId } from './enums/FontSetId';
import type { FormatId } from './enums/FormatId';
import type { LayoutId } from './enums/LayoutId';
import type { LineAlign } from './enums/LineAlign';
import type { LineTieKind } from './enums/LineTieKind';
import type { PaletteId } from './enums/PaletteId';
import type { PictureAnchor } from './enums/PictureAnchor';
import type { RowIcon } from './enums/RowIcon';

export interface ScheduleRow {
  label: string;
  time: string;
}

export interface PriceRow {
  amount: string;
  label: string;
}

export interface IncludesBlock {
  heading: string;
  items: string[];
}

export interface FlierBlocks {
  title: string;
  titleBottom?: string;
  script?: string;
  venue?: string[];
  schedule?: ScheduleRow[];
  prices?: PriceRow[];
  includes?: IncludesBlock;
  footer?: string;
}

export interface ListItem {
  date: string;
  schedule: ScheduleRow[];
  price?: string;
}

export interface PictureSlot {
  imageId: string;
  anchor: PictureAnchor;
  scale: number;
  overlap?: PictureOverlap;
}

/** Grows the picture by scale around its anchor and shifts it by dx, dy (canvas fractions); text is drawn over it. */
export interface PictureOverlap {
  scale: number;
  dx: number;
  dy: number;
}

/** Row icon discs, divider rules, price label scale and venue face/pin; a short icon list repeats its last icon; px at a 1080 short edge. */
export interface RowTheme {
  icons?: { schedule?: RowIcon[]; prices?: RowIcon[]; size?: number };
  dividers?: { thickness: number; color?: string; gap?: number; toPicture?: boolean; reach?: number; lengths?: number[] };
  priceLabelScale?: number;
  venue?: { body?: boolean; bare?: boolean; oneLine?: boolean; pinSize?: number; pinGap?: number; pinShift?: number; centred?: boolean };
  priceGap?: number;
  labelScale?: number;
  timeScale?: number;
  timeWeight?: number;
  textWidth?: number;
}

export interface LogoSlot {
  imageId: string;
}

export interface FlierDoc {
  version: 1;
  format: FormatId;
  layout: LayoutId;
  palette: PaletteId;
  fonts: FontSetId;
  background: BackgroundStyle;
  picture?: PictureSlot;
  logo?: LogoSlot;
  blocks: FlierBlocks;
  items?: ListItem[];
  tuning?: PosterTuning;
  lineStyles?: Record<LineKey, LineStyle | undefined>;
  lineTies?: LineTie[];
  rows?: RowTheme;
}

/** A text line path such as "title", "venue.1", "schedule.0.time" or "items.2.date" (see LINE_KEY_PATTERN). */
export type LineKey = string;

/** Optional per-line overrides of the theme; an absent field keeps the theme value. letterSpacing is in em. */
export interface LineStyle {
  font?: string;
  sizeScale?: number;
  color?: string;
  weight?: number;
  italic?: boolean;
  letterSpacing?: number;
  align?: LineAlign;
}

/** Two lines drawn at one width (width) or one font size (size). */
export interface LineTie {
  kind: LineTieKind;
  lines: [LineKey, LineKey];
}

/** Optional per-theme spacing and size overrides; an absent field keeps the layout default. */
export interface PosterTuning {
  headerGap?: number;
  itemDateScale?: number;
  headerTop?: number;
  titleScriptGap?: number;
  scriptTitleGap?: number;
  titleScale?: number;
  titleBottomScale?: number;
  headerTextWidth?: number;
  bodyTop?: number;
  headerHeight?: number;
  titleSpacing?: number;
  scriptScale?: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PosterImage {
  readonly width: number;
  readonly height: number;
}

export type PosterAssets = Record<string, PosterImage | undefined>;

export interface TextMetricsLike {
  width: number;
}

export interface PosterGradient {
  addColorStop(offset: number, color: string): void;
}

export interface PosterContext {
  font: string;
  fillStyle: string | PosterGradient;
  textAlign: string;
  textBaseline: string;
  globalAlpha: number;
  letterSpacing?: string;
  save(): void;
  restore(): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): TextMetricsLike;
  drawImage(image: PosterImage, dx: number, dy: number, dw: number, dh: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  arcTo(x1: number, y1: number, x2: number, y2: number, r: number): void;
  arc(x: number, y: number, r: number, start: number, end: number): void;
  closePath(): void;
  fill(): void;
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): PosterGradient;
}

export interface PosterCanvas {
  width: number;
  height: number;
  getContext(kind: '2d'): PosterContext | null;
}

export interface RenderReport {
  width: number;
  height: number;
  picture: Rect | null;
  pictureRegion: Rect;
  textBoxes: Rect[];
  cardBoxes: Rect[];
  iconBoxes: Rect[];
  ruleBoxes: Rect[];
  logo: Rect | null;
  backdrop: Rect | null;
}

export interface Palette {
  background: string;
  tint: string;
  title: string;
  accent: string;
  ink: string;
  soft: string;
  card: string;
  arch: string;
  sky?: readonly SkyStop[];
  script?: string;
  icon?: string;
  rule?: string;
  brush?: readonly string[];
}

/** One gradient stop of a horizon sky: offset 0 (top) to 1 (bottom) and its colour. */
export type SkyStop = readonly [number, string];

export interface FontSet {
  display: string;
  script: string;
  body: string;
}
