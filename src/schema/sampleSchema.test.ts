import { validateFlierDoc } from '../index';
import { sampleDoc } from '../testing/docs';

describe('validateFlierDoc with sample options', () => {
  it('with the Kizomba sample doc, accepts it', () => {
    const doc = sampleDoc();

    const result = validateFlierDoc(doc);

    expect(result.ok).toBe(true);
  });

  it('with an unknown row icon, rejects the doc', () => {
    const doc = { ...sampleDoc(), rows: { icons: { schedule: ['star'] } } };

    const result = validateFlierDoc(doc);

    expect(result.ok).toBe(false);
  });

  it('with an overlap scale of 2, rejects the doc', () => {
    const doc = sampleDoc();
    const bad = { ...doc, picture: { ...doc.picture, overlap: { scale: 2, dx: 0, dy: 0 } } };

    const result = validateFlierDoc(bad);

    expect(result.ok).toBe(false);
  });
});
