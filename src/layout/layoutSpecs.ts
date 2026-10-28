import { LayoutId } from '../enums/LayoutId';
import type { Rect } from '../types';

type Frac = [number, number, number, number];

export interface LayoutSpec {
  header: Frac;
  body: Frac;
  picture: Frac;
  alignX: number;
  flanks?: [Frac, Frac];
  logo?: Frac;
  arch?: number;
}

interface OrientedSpec {
  portrait: LayoutSpec;
  landscape: LayoutSpec;
}

const flanksBeside = (pic: Frac, top: number, bottom: number, m: number): [Frac, Frac] => [
  [m, top, pic[0] - 2 * m, bottom - top],
  [pic[0] + pic[2] + m, top, 1 - pic[0] - pic[2] - 2 * m, bottom - top],
];

const ARCH_PIC: Frac = [0.22, 0.42, 0.56, 0.58];
const PHONE_ARCH_PIC: Frac = [0.2, 0.47, 0.6, 0.53];
const DESK_ARCH_PIC: Frac = [0.355, 0.07, 0.32, 0.93];

const ARCH_LANDSCAPE: LayoutSpec = {
  header: [0.04, 0.06, 0.3, 0.5],
  body: [0.04, 0.58, 0.3, 0.36],
  picture: [0.36, 0.08, 0.3, 0.92],
  alignX: 0.5,
  flanks: [[0.68, 0.08, 0.28, 0.42], [0.68, 0.52, 0.28, 0.42]],
  arch: 0.06,
};

export const LAYOUT_SPECS: Partial<Record<LayoutId, OrientedSpec>> = {
  [LayoutId.Arch]: {
    portrait: { header: [0.045, 0.025, 0.91, 0.18], body: [0.045, 0.215, 0.91, 0.19], picture: ARCH_PIC, alignX: 0.5, flanks: flanksBeside(ARCH_PIC, 0.44, 0.97, 0.03), arch: 0.04 },
    landscape: ARCH_LANDSCAPE,
  },
  [LayoutId.PhoneClockSafe]: {
    portrait: { header: [0.045, 0.28, 0.91, 0.2], body: [0.045, 0.5, 0.42, 0.44], picture: [0.48, 0.5, 0.52, 0.5], alignX: 1 },
    landscape: { header: [0.04, 0.2, 0.52, 0.3], body: [0.04, 0.52, 0.52, 0.42], picture: [0.6, 0.12, 0.4, 0.88], alignX: 1 },
  },
  [LayoutId.PhoneArch]: {
    portrait: { header: [0.045, 0.05, 0.91, 0.16], body: [0.045, 0.22, 0.91, 0.21], picture: PHONE_ARCH_PIC, alignX: 0.5, flanks: flanksBeside(PHONE_ARCH_PIC, 0.5, 0.94, 0.03), arch: 0.08 },
    landscape: { ...ARCH_LANDSCAPE, header: [0.04, 0.16, 0.3, 0.42], picture: [0.36, 0.16, 0.3, 0.84] },
  },
  [LayoutId.DesktopSafe]: {
    portrait: { header: [0.08, 0.06, 0.84, 0.24], body: [0.08, 0.31, 0.46, 0.58], picture: [0.56, 0.36, 0.44, 0.64], alignX: 1 },
    landscape: { header: [0.0625, 0.05, 0.58, 0.44], body: [0.0625, 0.5, 0.58, 0.38], picture: [0.67, 0.0972, 0.29, 0.9028], alignX: 1, logo: [0.4, 0.045, 0.09, 0.17] },
  },
  [LayoutId.DesktopArch]: {
    portrait: { header: [0.08, 0.06, 0.84, 0.2], body: [0.08, 0.27, 0.84, 0.2], picture: [0.14, 0.48, 0.72, 0.52], alignX: 0.5, arch: 0.05 },
    landscape: { header: [0.07, 0.3, 0.26, 0.45], body: [0.7, 0.25, 0.27, 0.65], picture: DESK_ARCH_PIC, alignX: 0.5, logo: [0.86, 0.03, 0.11, 0.18], arch: 0.05 },
  },
};

const r = Math.round;

export const toRect = (f: Frac, w: number, h: number): Rect => {
  const x = r(f[0] * w);
  const y = r(f[1] * h);
  return { x, y, w: r((f[0] + f[2]) * w) - x, h: r((f[1] + f[3]) * h) - y };
};
