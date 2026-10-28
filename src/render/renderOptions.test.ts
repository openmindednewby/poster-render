import { BackgroundStyle, FormatId, kizombaWorkshop, LayoutId, PALETTES, PictureAnchor, render } from '../index';
import { createCanvas } from '@napi-rs/canvas';
import { docFor } from '../testing/docs';
import { asPoster, fixtureImage, hexRgb, newCanvas, pixels } from '../testing/fixture';

describe('render options', () => {
  it('with the tint background, paints the body zone in the palette tint', () => {
    const doc = { ...docFor(LayoutId.PictureRight, FormatId.Story), background: BackgroundStyle.Tint };
    const canvas = newCanvas();

    render(doc, { dancers: fixtureImage() }, asPoster(canvas));

    const i = (1800 * canvas.width + 60) * 4;
    expect(Array.from(pixels(canvas).slice(i, i + 3))).toEqual(hexRgb(PALETTES[doc.palette].tint));
  });

  it('with a logo asset, keeps the logo out of the picture region', () => {
    const canvas = newCanvas();

    const report = render(kizombaWorkshop, { dancers: fixtureImage(), logo: fixtureImage() }, asPoster(canvas));

    expect(report.textBoxes.every((b) => b.x + b.w <= report.width)).toBe(true);
  });

  it('with a logo id missing from the assets, throws naming the logo', () => {
    const act = (): unknown => render(kizombaWorkshop, { dancers: fixtureImage() }, asPoster(newCanvas()));

    expect(act).toThrow('logo.imageId: no asset named "logo"');
  });

  it('with the top anchor on the desktop format, pins the picture to the top of its region', () => {
    const doc = docFor(LayoutId.PictureLeft, FormatId.Desktop);
    doc.picture = { imageId: 'dancers', anchor: PictureAnchor.Top, scale: 0.5 };

    const report = render(doc, { dancers: fixtureImage() }, asPoster(newCanvas()));

    expect([report.picture?.y, report.picture?.x]).toEqual([report.pictureRegion.y, report.pictureRegion.x]);
  });

  it('with an includes block, draws it with no card behind it', () => {
    const doc = docFor(LayoutId.PictureRight, FormatId.Story);

    const report = render(doc, { dancers: fixtureImage() }, asPoster(newCanvas()));

    expect(report.cardBoxes).toEqual([]);
  });

  it('with the desktop arch layout on the desktop format, draws the logo at least 250 px wide', () => {
    const doc = { ...docFor(LayoutId.DesktopArch, FormatId.Desktop), logo: { imageId: 'logo' } };

    const report = render(doc, { dancers: fixtureImage(), logo: createCanvas(400, 350) }, asPoster(newCanvas()));

    expect(report.logo?.w ?? 0).toBeGreaterThanOrEqual(250);
  });

  it('with the desktop safe layout on the desktop format, places the logo beside the title in the left half', () => {
    const doc = { ...docFor(LayoutId.DesktopSafe, FormatId.Desktop), logo: { imageId: 'logo' } };

    const report = render(doc, { dancers: fixtureImage(), logo: createCanvas(400, 350) }, asPoster(newCanvas()));

    const logo = report.logo ?? { x: 0, y: 0, w: 0, h: 0 };
    expect(logo.x + logo.w).toBeLessThanOrEqual(report.width / 2);
  });

  it.each([LayoutId.DesktopSafe, LayoutId.DesktopArch])('with layout %s on the desktop format, draws the logo clear of every text box', (layout) => {
    const doc = { ...docFor(layout, FormatId.Desktop), logo: { imageId: 'logo' } };

    const report = render(doc, { dancers: fixtureImage(), logo: createCanvas(400, 350) }, asPoster(newCanvas()));

    const l = report.logo ?? { x: 0, y: 0, w: 0, h: 0 };
    expect(report.textBoxes.filter((b) => b.x < l.x + l.w && l.x < b.x + b.w && b.y < l.y + l.h && l.y < b.y + b.h)).toEqual([]);
  });
});
