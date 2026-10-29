import { BackgroundStyle } from '../enums/BackgroundStyle';
import type { LayoutGeometry } from '../layout/geometry';
import type { FlierDoc, Palette, PosterContext, Rect, SkyStop } from '../types';
import { paintBrush } from './brush';

/** Fills the whole canvas: the palette background, or for the horizon style a top-to-bottom sky gradient with no sea band. */
export function paintGround(ctx: PosterContext, style: BackgroundStyle, palette: Palette, size: { width: number; height: number }): void {
  ctx.fillStyle = palette.background;
  if (style === BackgroundStyle.Horizon) {
    const stops: readonly SkyStop[] = palette.sky ?? [[0, palette.background], [1, palette.tint]];
    const sky = ctx.createLinearGradient(0, 0, 0, size.height);
    stops.forEach(([offset, color]) => sky.addColorStop(offset, color));
    ctx.fillStyle = sky;
  }
  ctx.fillRect(0, 0, size.width, size.height);
}

/** Paints the ground, the tint bands and, for the brush style, the strokes around the picture. */
export function paintPage(ctx: PosterContext, doc: FlierDoc, palette: Palette, page: { geo: LayoutGeometry; width: number; height: number; picture: Rect | null }): void {
  ctx.globalAlpha = 1;
  paintGround(ctx, doc.background, palette, page);
  if (doc.background === BackgroundStyle.Tint) {
    ctx.fillStyle = palette.tint;
    [page.geo.header, page.geo.body].forEach((r) => ctx.fillRect(r.x, r.y, r.w, r.h));
  }
  if (doc.background === BackgroundStyle.Brush && page.picture) {
    paintBrush(ctx, page.picture, palette.brush ?? [palette.tint, palette.arch]);
  }
}
