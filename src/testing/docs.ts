import { BackgroundStyle } from '../enums/BackgroundStyle';
import { FontSetId } from '../enums/FontSetId';
import { FormatId } from '../enums/FormatId';
import { LayoutId } from '../enums/LayoutId';
import { PaletteId } from '../enums/PaletteId';
import { PictureAnchor } from '../enums/PictureAnchor';
import type { FlierDoc } from '../types';

export const LAYOUTS = Object.values(LayoutId);
export const FORMATS = Object.values(FormatId);
export const COMBOS: [LayoutId, FormatId][] = LAYOUTS.flatMap((l) => FORMATS.map((f): [LayoutId, FormatId] => [l, f]));

const slots = (a: string, b: string): { label: string; time: string }[] => [
  { label: 'Level 1', time: a },
  { label: 'Level 2', time: b },
];

export function docFor(layout: LayoutId, format: FormatId): FlierDoc {
  return {
    version: 1,
    format,
    layout,
    palette: PaletteId.Sand,
    fonts: FontSetId.Classic,
    background: BackgroundStyle.Solid,
    picture: { imageId: 'dancers', anchor: PictureAnchor.Bottom, scale: 1 },
    blocks: {
      title: 'KIZOMBA',
      titleBottom: 'WORKSHOP',
      script: 'Saturday 31 October',
      venue: ['Bailemos', 'Dance School'],
      schedule: slots('20:00 - 21:00', '21:00 - 22:00'),
      prices: [{ amount: '5€', label: 'per hour' }, { amount: '20€', label: 'Party pass' }],
      includes: { heading: 'Party pass includes', items: ['Salsa & Bachata room', 'Kizomba dedicated room', '2 drinks'] },
      footer: 'with Jimmy & Ismini',
    },
    items: [
      { date: 'Sat 31 Oct', schedule: slots('20:00 - 21:00', '21:00 - 22:00'), price: 'Party pass 20€' },
      { date: 'Sat 7 Nov', schedule: slots('20:00 - 21:00', '21:00 - 22:00'), price: 'Party pass 15€' },
      { date: 'Sun 29 Nov', schedule: slots('17:00 - 18:00', '18:00 - 19:00'), price: 'Party pass 10€' },
    ],
  };
}

export function withoutPicture(doc: FlierDoc): FlierDoc {
  const copy = { ...doc };
  delete copy.picture;
  return copy;
}
