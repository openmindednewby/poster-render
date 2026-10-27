import { BackgroundStyle } from '../enums/BackgroundStyle';
import { FontSetId } from '../enums/FontSetId';
import { FormatId } from '../enums/FormatId';
import { LayoutId } from '../enums/LayoutId';
import { PaletteId } from '../enums/PaletteId';
import { PictureAnchor } from '../enums/PictureAnchor';
import type { JsonSchema } from './jsonSchemaTypes';

const SHORT = 60;
const LINE = 120;
const MAX_ROWS = 6;
const MAX_ITEMS = 8;
const MAX_PRICES = 4;
const MAX_VENUE = 3;
const MIN_SCALE = 0.3;

const text = (maxLength: number): JsonSchema => ({ type: 'string', minLength: 1, maxLength });

const scheduleRow: JsonSchema = {
  type: 'object',
  required: ['label', 'time'],
  additionalProperties: false,
  properties: { label: text(SHORT), time: text(SHORT) },
};

const scheduleList: JsonSchema = { type: 'array', items: scheduleRow, minItems: 1, maxItems: MAX_ROWS };

const blocks: JsonSchema = {
  type: 'object',
  required: ['title'],
  additionalProperties: false,
  properties: {
    title: text(SHORT),
    titleBottom: text(SHORT),
    script: text(SHORT),
    venue: { type: 'array', items: text(SHORT), minItems: 1, maxItems: MAX_VENUE },
    schedule: scheduleList,
    prices: {
      type: 'array',
      minItems: 1,
      maxItems: MAX_PRICES,
      items: {
        type: 'object',
        required: ['amount', 'label'],
        additionalProperties: false,
        properties: { amount: text(SHORT), label: text(SHORT) },
      },
    },
    includes: {
      type: 'object',
      required: ['heading', 'items'],
      additionalProperties: false,
      properties: { heading: text(SHORT), items: { type: 'array', items: text(LINE), minItems: 1, maxItems: MAX_ROWS } },
    },
    footer: text(LINE),
  },
};

export const flierDocSchema: JsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://dloizides.com/schemas/flier-doc-v1.json',
  title: 'FlierDoc',
  description: 'One poster or wallpaper: format, layout, palette, fonts, picture slot and text blocks.',
  type: 'object',
  required: ['version', 'format', 'layout', 'palette', 'fonts', 'background', 'blocks'],
  additionalProperties: false,
  properties: {
    version: { const: 1 },
    format: { type: 'string', enum: Object.values(FormatId) },
    layout: { type: 'string', enum: Object.values(LayoutId) },
    palette: { type: 'string', enum: Object.values(PaletteId) },
    fonts: { type: 'string', enum: Object.values(FontSetId) },
    background: { type: 'string', enum: Object.values(BackgroundStyle) },
    picture: {
      type: 'object',
      required: ['imageId', 'anchor', 'scale'],
      additionalProperties: false,
      properties: {
        imageId: text(SHORT),
        anchor: { type: 'string', enum: Object.values(PictureAnchor) },
        scale: { type: 'number', minimum: MIN_SCALE, maximum: 1 },
      },
    },
    logo: { type: 'object', required: ['imageId'], additionalProperties: false, properties: { imageId: text(SHORT) } },
    blocks,
    items: {
      type: 'array',
      minItems: 1,
      maxItems: MAX_ITEMS,
      items: {
        type: 'object',
        required: ['date', 'schedule'],
        additionalProperties: false,
        properties: { date: text(SHORT), schedule: scheduleList, price: text(SHORT) },
      },
    },
  },
};
