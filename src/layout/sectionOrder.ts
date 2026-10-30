import { BodySection } from '../enums/BodySection';
import { LayoutId } from '../enums/LayoutId';
import type { FlierDoc } from '../types';

const EVENT_ORDER = [BodySection.Venue, BodySection.Schedule, BodySection.Prices, BodySection.Includes, BodySection.Footer];
const LIST_ORDER = [BodySection.Venue, BodySection.Items, BodySection.Prices, BodySection.Includes, BodySection.Footer];

/** The body sections of a layout in the order it draws them; the title block always sits above. */
export function defaultSectionOrder(layout: LayoutId): BodySection[] {
  return [...(layout === LayoutId.List ? LIST_ORDER : EVENT_ORDER)];
}

/** The doc's own section order (unknown and repeated entries dropped), then the layout's remaining sections. */
export function sectionOrderOf(doc: Pick<FlierDoc, 'layout' | 'sectionOrder'>): BodySection[] {
  const base = defaultSectionOrder(doc.layout);
  const own = (doc.sectionOrder ?? []).filter((s, i, all) => base.includes(s) && all.indexOf(s) === i);
  return [...own, ...base.filter((s) => !own.includes(s))];
}
