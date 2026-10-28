import { FormatId } from '../enums/FormatId';
import { LayoutId } from '../enums/LayoutId';
import { FORMAT_SIZES } from '../formats';
import { render } from '../index';
import { docFor } from '../testing/docs';
import { asPoster, newCanvas, tallImage } from '../testing/fixture';

const HEADER_HEIGHT_SHARE = 0.25;
const MIN_WIDTH_SHARE = 0.75;
const TARGET_WIDTH_SHARE = 0.8;
const GAP_U = 40;
const BASE = 1080;

describe('render picture-bottom with a tall picture', () => {
  it('on a story, sizes the picture to about 0.8 of the width, below the body, on the bottom edge', () => {
    const { width, height } = FORMAT_SIZES[FormatId.Story];
    const canvas = newCanvas();

    const report = render(docFor(LayoutId.PictureBottom, FormatId.Story), { dancers: tallImage() }, asPoster(canvas));

    const picture = report.picture ?? { x: 0, y: 0, w: 0, h: 0 };
    const bodyEnd = Math.max(...report.textBoxes.map((b) => b.y + b.h));
    expect(picture.w).toBeGreaterThanOrEqual(width * MIN_WIDTH_SHARE);
    expect(picture.w).toBeLessThanOrEqual(Math.ceil(width * TARGET_WIDTH_SHARE));
    expect(picture.y).toBeGreaterThanOrEqual(Math.floor(bodyEnd + (GAP_U * Math.min(width, height)) / BASE));
    expect(picture.y).toBeGreaterThanOrEqual(height * HEADER_HEIGHT_SHARE);
    expect(height - (picture.y + picture.h)).toBeLessThanOrEqual(1);
  });
});
