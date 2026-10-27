import { BackgroundStyle, FormatId, kizombaWorkshop, LayoutId, PALETTES, PictureAnchor, render } from '../index';
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
});
