import { LineAlign } from '../enums/LineAlign';
import { LineTieKind } from '../enums/LineTieKind';
import type { JsonSchema } from './jsonSchemaTypes';

/** Every text line a style or tie can name: block fields by path, list items by index. */
export const LINE_KEY_PATTERN =
  '^(title|titleBottom|script|footer|includes[.]heading|includes[.]items[.][0-5]|venue[.][0-2]|schedule[.][0-5][.](label|time)|prices[.][0-3][.](amount|label)|items[.][0-7][.](date|price|schedule[.][0-5]))$';

const MAX_FONT = 40;
const MIN_SPACING = -0.1;
const MAX_SPACING = 0.5;
const MAX_TIES = 12;
const MAX_SPACE = 2;
const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

const lineKey: JsonSchema = { type: 'string', pattern: LINE_KEY_PATTERN };

const lineStyle: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    font: { type: 'string', minLength: 1, maxLength: MAX_FONT, pattern: '^[A-Za-z0-9 ]+$' },
    sizeScale: { type: 'number', minimum: 0 },
    widthScale: { type: 'number', minimum: 0 },
    color: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
    weight: { type: 'integer', enum: WEIGHTS },
    italic: { type: 'boolean' },
    letterSpacing: { type: 'number', minimum: MIN_SPACING, maximum: MAX_SPACING },
    align: { type: 'string', enum: Object.values(LineAlign) },
    spaceAbove: { type: 'number', minimum: 0, maximum: MAX_SPACE },
    spaceBelow: { type: 'number', minimum: 0, maximum: MAX_SPACE },
  },
};

export const lineStylesSchema: JsonSchema = { type: 'object', propertyNames: lineKey, additionalProperties: lineStyle };

export const lineTiesSchema: JsonSchema = {
  type: 'array',
  maxItems: MAX_TIES,
  items: {
    type: 'object',
    required: ['kind', 'lines'],
    additionalProperties: false,
    properties: {
      kind: { type: 'string', enum: Object.values(LineTieKind) },
      lines: { type: 'array', minItems: 2, maxItems: 2, items: lineKey },
    },
  },
};
