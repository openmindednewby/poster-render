import { FormatId } from './enums/FormatId';
import { LayoutId } from './enums/LayoutId';

export interface LayoutCatalogueEntry {
  id: LayoutId;
  designId: string;
  label: string;
  description: string;
  formats: readonly FormatId[];
}

const POSTERS = [FormatId.Story, FormatId.Post, FormatId.Square];

export const LAYOUT_CATALOGUE: readonly LayoutCatalogueEntry[] = [
  { id: LayoutId.PictureRight, designId: 'E-A', label: 'Picture right', description: 'Titles across the top, details on the left, the picture on the right standing on the bottom edge.', formats: POSTERS },
  { id: LayoutId.PictureLeft, designId: 'E-B', label: 'Picture left', description: 'Titles across the top, the picture on the left standing on the bottom edge, details on the right.', formats: POSTERS },
  { id: LayoutId.Arch, designId: 'E-C', label: 'Arch', description: 'Titles and details on top, the picture centred in a soft arch at the bottom, prices either side.', formats: POSTERS },
  { id: LayoutId.PictureBottom, designId: 'picture-bottom', label: 'Picture bottom', description: 'Titles and details on top, the picture across the bottom half.', formats: POSTERS },
  { id: LayoutId.List, designId: 'list', label: 'Upcoming list', description: 'Several dated events as a list beside the picture.', formats: POSTERS },
  { id: LayoutId.PhoneClockSafe, designId: 'P-A', label: 'Phone, clock clear', description: 'Lock-screen wallpaper: top kept clear for the clock, details on the left, picture on the right.', formats: [FormatId.Phone] },
  { id: LayoutId.PhoneArch, designId: 'P-B', label: 'Phone arch', description: 'Lock-screen wallpaper: top kept clear for the clock, details in the middle, the picture in an arch at the bottom.', formats: [FormatId.Phone] },
  { id: LayoutId.DesktopSafe, designId: 'D-A', label: 'Desktop, icons clear', description: 'Desktop wallpaper: text on the left clear of desktop icons and the taskbar, the picture on the right.', formats: [FormatId.Desktop] },
  { id: LayoutId.DesktopArch, designId: 'D-B', label: 'Desktop arch', description: 'Desktop wallpaper: titles left, the picture in a centred arch, details right.', formats: [FormatId.Desktop] },
];

const DEFAULTS: Readonly<Record<FormatId, LayoutId>> = {
  [FormatId.Story]: LayoutId.PictureRight,
  [FormatId.Post]: LayoutId.PictureRight,
  [FormatId.Square]: LayoutId.PictureRight,
  [FormatId.Phone]: LayoutId.PhoneClockSafe,
  [FormatId.Desktop]: LayoutId.DesktopSafe,
};

/** The default layout for a format (D4 "Layouts: keep all"): E-A "Picture right" for posters, P-A "Phone, clock clear", D-A "Desktop, icons clear". */
export function defaultLayoutFor(format: FormatId): LayoutId {
  return DEFAULTS[format];
}
