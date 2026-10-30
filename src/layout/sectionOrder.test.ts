import { BodySection, FormatId, LayoutId, defaultSectionOrder, render, roleOf, validateFlierDoc, type RenderReport } from '../index';
import { docFor } from '../testing/docs';
import { asPoster, fixtureImage, newCanvas } from '../testing/fixture';

const assets = { dancers: fixtureImage() };

function reportOf(order?: BodySection[]): RenderReport {
  const doc = docFor(LayoutId.PictureRight, FormatId.Story);
  return render(order === undefined ? doc : { ...doc, sectionOrder: order }, assets, asPoster(newCanvas()));
}

describe('defaultSectionOrder', () => {
  it('with the list layout, puts the items where the schedule sits', () => {
    const order = defaultSectionOrder(LayoutId.List);

    expect(order).toEqual([BodySection.Venue, BodySection.Items, BodySection.Prices, BodySection.Includes, BodySection.Footer]);
  });
});

describe('render with a sectionOrder', () => {
  it('with the footer moved first, draws the footer above the venue', () => {
    const report = reportOf([BodySection.Footer]);

    const footerTop = report.lineBoxes.footer?.y ?? Infinity;

    expect(footerTop).toBeLessThan(report.lineBoxes['venue.0']?.y ?? 0);
  });

  it('with prices then venue, reports that order followed by the rest of the layout order', () => {
    const report = reportOf([BodySection.Prices, BodySection.Venue]);

    expect(report.sectionOrder).toEqual([BodySection.Prices, BodySection.Venue, BodySection.Schedule, BodySection.Includes, BodySection.Footer]);
  });

  it('without an order, reports the roles top to bottom from the title, venue before footer', () => {
    const { roleOrder } = reportOf();

    expect([roleOrder[0], roleOrder.indexOf('venue') < roleOrder.indexOf('footer')]).toEqual(['title', true]);
  });

  it('with the footer moved first, reports the footer role before the venue role', () => {
    const { roleOrder } = reportOf([BodySection.Footer]);

    expect(roleOrder.indexOf('footer')).toBeLessThan(roleOrder.indexOf('venue'));
  });

  it('with a title section, rejects the doc', () => {
    const doc = docFor(LayoutId.PictureRight, FormatId.Story);

    const result = validateFlierDoc({ ...doc, sectionOrder: ['title'] });

    expect(result.ok).toBe(false);
  });
});

describe('roleOf', () => {
  it('with schedule.0.label, returns schedule.label', () => {
    const role = roleOf('schedule.0.label');

    expect(role).toBe('schedule.label');
  });
});
