import { RowIcon } from '../enums/RowIcon';
import type { JsonSchema } from './jsonSchemaTypes';

const MAX_ROWS = 6;
const MAX_PRICES = 4;
const MIN_ICON = 16;
const MAX_ICON = 300;
const MIN_THICKNESS = 0.5;
const MAX_THICKNESS = 20;
const MAX_GAP = 120;
const MAX_OVERLAP = 1.5;
const MAX_SHIFT = 0.5;
const MAX_TOP = 600;
const MAX_LINE_GAP = 200;
const MIN_TITLE_SCALE = 0.3;
const MAX_TITLE_SCALE = 2.5;
const MIN_LABEL_SCALE = 0.3;
const MAX_ROW_SCALE = 2;
const MIN_WEIGHT = 100;
const MAX_WEIGHT = 900;
const MIN_WIDTH = 100;
const MAX_LENGTH = 1080;
const MAX_BODY_TOP = 1920;
const MAX_LENGTHS = 12;
const MIN_SPACING = -0.2;
const MAX_SPACING = 0.5;

const num = (minimum: number, maximum: number): JsonSchema => ({ type: 'number', minimum, maximum });
const icons = (maxItems: number): JsonSchema => ({ type: 'array', items: { type: 'string', enum: Object.values(RowIcon) }, minItems: 1, maxItems });

export const rowsSchema: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    icons: { type: 'object', additionalProperties: false, properties: { schedule: icons(MAX_ROWS), prices: icons(MAX_PRICES), size: num(MIN_ICON, MAX_ICON) } },
    dividers: {
      type: 'object',
      required: ['thickness'],
      additionalProperties: false,
      properties: {
        thickness: num(MIN_THICKNESS, MAX_THICKNESS),
        color: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        gap: num(0, MAX_GAP),
        toPicture: { type: 'boolean' },
        reach: num(0, 1),
        lengths: { type: 'array', items: num(0, MAX_LENGTH), minItems: 1, maxItems: MAX_LENGTHS },
      },
    },
    priceLabelScale: num(MIN_LABEL_SCALE, 1),
    venue: { type: 'object', additionalProperties: false, properties: { body: { type: 'boolean' }, bare: { type: 'boolean' }, oneLine: { type: 'boolean' }, pinSize: num(0, MAX_LENGTH), pinGap: num(0, MAX_GAP), pinShift: num(-MAX_GAP, MAX_GAP), centred: { type: 'boolean' } } },
    priceGap: num(-MAX_GAP, MAX_GAP),
    labelScale: num(MIN_LABEL_SCALE, MAX_ROW_SCALE),
    timeScale: num(MIN_LABEL_SCALE, MAX_ROW_SCALE),
    timeWeight: num(MIN_WEIGHT, MAX_WEIGHT),
    textWidth: num(MIN_WIDTH, MAX_LENGTH),
  },
};

export const overlapSchema: JsonSchema = {
  type: 'object',
  required: ['scale', 'dx', 'dy'],
  additionalProperties: false,
  properties: { scale: num(1, MAX_OVERLAP), dx: num(-MAX_SHIFT, MAX_SHIFT), dy: num(-MAX_SHIFT, MAX_SHIFT) },
};

export const headerTuningSchema: Record<string, JsonSchema> = {
  headerTop: num(0, MAX_TOP),
  titleScriptGap: num(-MAX_LINE_GAP, MAX_LINE_GAP),
  scriptTitleGap: num(-MAX_LINE_GAP, MAX_LINE_GAP),
  titleScale: num(MIN_TITLE_SCALE, MAX_TITLE_SCALE),
  titleBottomScale: num(MIN_TITLE_SCALE, MAX_TITLE_SCALE),
  headerTextWidth: num(MIN_WIDTH, MAX_LENGTH),
  bodyTop: num(0, MAX_BODY_TOP),
  headerHeight: num(MIN_WIDTH, MAX_BODY_TOP),
  titleSpacing: num(MIN_SPACING, MAX_SPACING),
  scriptScale: num(MIN_TITLE_SCALE, MAX_TITLE_SCALE),
};
