import { exportPng, FORMAT_SIZES, LayoutId, render } from './index';
import { docFor, FORMATS } from './testing/docs';
import { asPoster, fixtureImage, newCanvas } from './testing/fixture';

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

describe('exportPng AC-03 formats', () => {
  it.each(FORMATS)('with format %s, exports a PNG of exactly the format size', async (format) => {
    const canvas = newCanvas();
    render(docFor(LayoutId.PictureRight, format), { dancers: fixtureImage() }, asPoster(canvas));

    const blob = exportPng(canvas);

    const bytes = new DataView(await blob.arrayBuffer());
    expect(blob.type).toBe('image/png');
    expect(PNG_SIGNATURE.map((_, i) => bytes.getUint8(i))).toEqual(PNG_SIGNATURE);
    expect({ width: bytes.getUint32(16), height: bytes.getUint32(20) }).toEqual(FORMAT_SIZES[format]);
  });

  it('with a canvas that returns a non-PNG data URL, throws a readable error', () => {
    const canvas = { toDataURL: (): string => 'data:,' };

    const act = (): Blob => exportPng(canvas);

    expect(act).toThrow('PNG');
  });
});
