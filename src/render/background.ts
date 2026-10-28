import { BackgroundStyle } from '../enums/BackgroundStyle';
import type { Palette, PosterContext, SkyStop } from '../types';

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
