import { BackgroundStyle } from '../enums/BackgroundStyle';
import { FontSetId } from '../enums/FontSetId';
import { FormatId } from '../enums/FormatId';
import { LayoutId } from '../enums/LayoutId';
import { PaletteId } from '../enums/PaletteId';
import { PictureAnchor } from '../enums/PictureAnchor';
import type { FlierBlocks, FlierDoc, ScheduleRow } from '../types';

interface Workshop {
  script: string;
  date: string;
  first: string;
  second: string;
  party: string;
}

const WORKSHOPS: Workshop[] = [
  { script: 'Saturday 31 October', date: 'Sat 31 Oct', first: '20:00 - 21:00', second: '21:00 - 22:00', party: '20€' },
  { script: 'Saturday 7 November', date: 'Sat 7 Nov', first: '20:00 - 21:00', second: '21:00 - 22:00', party: '15€' },
  { script: 'Sunday 29 November', date: 'Sun 29 Nov', first: '17:00 - 18:00', second: '18:00 - 19:00', party: '10€' },
];

const INCLUDES = { heading: 'Party pass includes', items: ['Salsa & Bachata room', 'Kizomba dedicated room', '2 drinks'] };

const schedule = (w: Workshop): ScheduleRow[] => [
  { label: 'Level 1', time: w.first },
  { label: 'Level 2', time: w.second },
];

const base = {
  version: 1 as const,
  format: FormatId.Story,
  palette: PaletteId.Sand,
  fonts: FontSetId.Classic,
  background: BackgroundStyle.Solid,
  picture: { imageId: 'dancers', anchor: PictureAnchor.Bottom, scale: 1 },
  logo: { imageId: 'logo' },
};

const shared: Omit<FlierBlocks, 'title'> = {
  venue: ['Bailemos', 'Dance School'],
  includes: INCLUDES,
  footer: 'with Jimmy & Ismini',
};

const workshopDoc = (w: Workshop): FlierDoc => ({
  ...base,
  layout: LayoutId.PictureRight,
  blocks: {
    ...shared,
    title: 'KIZOMBA',
    titleBottom: 'WORKSHOP',
    script: w.script,
    schedule: schedule(w),
    prices: [{ amount: '5€', label: 'per hour' }, { amount: w.party, label: 'Party pass' }],
  },
});

export const kizombaWorkshop: FlierDoc = {
  ...base,
  layout: LayoutId.List,
  blocks: {
    ...shared,
    title: 'UPCOMING',
    titleBottom: 'WORKSHOPS',
    script: 'Kizomba',
    prices: [{ amount: '5€', label: 'per hour' }],
  },
  items: WORKSHOPS.map((w) => ({ date: w.date, schedule: schedule(w), price: `Party pass ${w.party}` })),
};

export const kizombaWorkshopDocs: FlierDoc[] = [...WORKSHOPS.map(workshopDoc), kizombaWorkshop];
