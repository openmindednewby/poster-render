import { FormatId } from './enums/FormatId';

export interface FormatSize {
  width: number;
  height: number;
}

export const FORMAT_SIZES: Readonly<Record<FormatId, FormatSize>> = {
  [FormatId.Story]: { width: 1080, height: 1920 },
  [FormatId.Post]: { width: 1080, height: 1350 },
  [FormatId.Square]: { width: 1080, height: 1080 },
  [FormatId.Phone]: { width: 1170, height: 2532 },
  [FormatId.Desktop]: { width: 2560, height: 1440 },
};
