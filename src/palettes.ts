import { PaletteId } from './enums/PaletteId';
import type { Palette } from './types';

export const PALETTES: Readonly<Record<PaletteId, Palette>> = {
  [PaletteId.Sand]: { background: '#f5f4f2', tint: '#ece8e3', title: '#958a80', accent: '#e9b47f', ink: '#5f564f', soft: '#b3a89e', card: '#ffffff', arch: '#ede8e2' },
  [PaletteId.Night]: { background: '#1c1a17', tint: '#25221e', title: '#e8dccb', accent: '#e9b47f', ink: '#f4efe8', soft: '#9c9284', card: '#2c2824', arch: '#25221f' },
  [PaletteId.Sea]: { background: '#eef4f3', tint: '#e1ecea', title: '#4f7d7a', accent: '#e07a5f', ink: '#2f3e46', soft: '#8aa3a1', card: '#ffffff', arch: '#e4ecea' },
  [PaletteId.Rose]: { background: '#f8efec', tint: '#f1e2dd', title: '#9b6b63', accent: '#c9846f', ink: '#4a3934', soft: '#b39a92', card: '#ffffff', arch: '#f1e5e1' },
};
