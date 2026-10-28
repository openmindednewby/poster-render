import { FormatId } from '../enums/FormatId';
import { LayoutId } from '../enums/LayoutId';
import { render } from '../index';
import { docFor } from '../testing/docs';
import { asPoster, fixtureImage, newCanvas } from '../testing/fixture';
import { FlierDocError, validateFlierDoc } from './validateFlierDoc';

describe('validateFlierDoc', () => {
  it('with an own __proto__ key on the doc, rejects it as not allowed', () => {
    const json = JSON.stringify(docFor(LayoutId.PictureRight, FormatId.Story)).replace('{', '{"__proto__":1,');
    const input: unknown = JSON.parse(json);

    const result = validateFlierDoc(input);

    expect(result.ok ? [] : result.errors).toContain('__proto__: is not allowed');
  });
});

describe('render', () => {
  it('with picture imageId "constructor" and no such asset, throws FlierDocError naming it', () => {
    const doc = docFor(LayoutId.PictureRight, FormatId.Story);
    const input = { ...doc, picture: { ...doc.picture, imageId: 'constructor', anchor: doc.picture?.anchor, scale: doc.picture?.scale } };
    const message = 'picture.imageId: no asset named "constructor"';

    const act = (): unknown => render(input, { dancers: fixtureImage() }, asPoster(newCanvas()));

    expect(act).toThrow(FlierDocError);
    expect(act).toThrow(message);
  });
});
