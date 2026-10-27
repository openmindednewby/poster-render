import { FontSetId } from './enums/FontSetId';
import type { FontSet } from './types';

export const FONT_SETS: Readonly<Record<FontSetId, FontSet>> = {
  [FontSetId.Classic]: { display: '"Oswald", "Arial Narrow", sans-serif', script: '"Sacramento", cursive', body: '"Fredoka", sans-serif' },
  [FontSetId.Modern]: { display: '"Bebas Neue", "Arial Narrow", sans-serif', script: '"Great Vibes", cursive', body: '"Montserrat", sans-serif' },
  [FontSetId.Elegant]: { display: '"Playfair Display", serif', script: '"Allura", cursive', body: '"Lato", sans-serif' },
};
