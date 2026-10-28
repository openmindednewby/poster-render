import type { BackgroundStyle } from './enums/BackgroundStyle';
import type { FontSetId } from './enums/FontSetId';
import type { FormatId } from './enums/FormatId';
import type { LayoutId } from './enums/LayoutId';
import type { PaletteId } from './enums/PaletteId';
import type { PictureAnchor } from './enums/PictureAnchor';

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
}

/** One gradient stop of a horizon sky: offset 0 (top) to 1 (bottom) and its colour. */
export type SkyStop = readonly [number, string];

export interface FontSet {
  display: string;
  script: string;
  body: string;
}
