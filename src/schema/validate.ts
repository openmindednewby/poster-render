import type { JsonSchema } from './jsonSchemaTypes';

export const typeName = (v: unknown): string => {
  if (v === null) {
    return 'null';
  }
  return Array.isArray(v) ? 'array' : typeof v;
};

const join = (path: string, key: string): string => (path === '' ? key : `${path}.${key}`);
const show = (v: unknown): string => JSON.stringify(v) ?? typeName(v);

const ARTICLE: Record<string, string> = { object: 'an object', array: 'an array', string: 'a string', number: 'a number', integer: 'an integer' };

function matchesType(schema: JsonSchema, value: unknown): boolean {
  switch (schema.type) {
    case undefined:
      return true;
    case 'integer':
      return Number.isInteger(value);
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    default:
      return typeName(value) === schema.type;
  }
}

function checkString(schema: JsonSchema, value: string, path: string, errors: string[]): void {
  if (schema.minLength !== undefined && value.trim().length < schema.minLength) {
    errors.push(`${path}: must not be empty`);
  }
  if (schema.maxLength !== undefined && value.length > schema.maxLength) {
    errors.push(`${path}: must be at most ${schema.maxLength} characters (got ${value.length})`);
  }
}

function checkNumber(schema: JsonSchema, value: number, path: string, errors: string[]): void {
  if (schema.minimum !== undefined && value < schema.minimum) {
    errors.push(`${path}: must be at least ${schema.minimum} (got ${value})`);
  }
  if (schema.maximum !== undefined && value > schema.maximum) {
    errors.push(`${path}: must be at most ${schema.maximum} (got ${value})`);
  }
}

function checkArray(schema: JsonSchema, value: unknown[], path: string, errors: string[]): void {
  if (schema.minItems !== undefined && value.length < schema.minItems) {
    errors.push(`${path}: must have at least ${schema.minItems} entries (got ${value.length})`);
  }
  if (schema.maxItems !== undefined && value.length > schema.maxItems) {
    errors.push(`${path}: must have at most ${schema.maxItems} entries (got ${value.length})`);
    return;
  }
  const itemSchema = schema.items;
  if (itemSchema) {
    value.forEach((item, i) => validateAgainst(itemSchema, item, `${path}[${i}]`, errors));
  }
}

function checkObject(schema: JsonSchema, value: Record<string, unknown>, path: string, errors: string[]): void {
  const props = schema.properties ?? {};
  for (const key of schema.required ?? []) {
    if (value[key] === undefined) {
      errors.push(`${join(path, key)}: is required`);
    }
  }
  for (const [key, child] of Object.entries(value)) {
    const childSchema = Object.hasOwn(props, key) ? props[key] : undefined;
    if (childSchema === undefined) {
      if (schema.additionalProperties === false) {
        errors.push(`${join(path, key)}: is not allowed`);
      }
    } else if (child !== undefined) {
      validateAgainst(childSchema, child, join(path, key), errors);
    }
  }
}

export function validateAgainst(schema: JsonSchema, value: unknown, path: string, errors: string[]): void {
  if (schema.const !== undefined) {
    if (value !== schema.const) {
      errors.push(`${path}: must be ${schema.const} (got ${show(value)})`);
    }
    return;
  }
  if (!matchesType(schema, value)) {
    errors.push(`${path}: must be ${ARTICLE[schema.type ?? 'object']} (got ${typeName(value)})`);
    return;
  }
  if (schema.enum && !schema.enum.includes(value as string)) {
    errors.push(`${path}: must be one of ${schema.enum.join(', ')} (got ${show(value)})`);
    return;
  }
  if (typeof value === 'string') {
    checkString(schema, value, path, errors);
  } else if (typeof value === 'number') {
    checkNumber(schema, value, path, errors);
  } else if (Array.isArray(value)) {
    checkArray(schema, value, path, errors);
  } else if (typeName(value) === 'object') {
    checkObject(schema, value as Record<string, unknown>, path, errors);
  }
}
