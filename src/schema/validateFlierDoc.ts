import { LayoutId } from '../enums/LayoutId';
import type { FlierDoc, PosterAssets } from '../types';
import { flierDocSchema } from './flierDocSchema';
import { typeName, validateAgainst } from './validate';

export type FlierDocResult = { ok: true; doc: FlierDoc } | { ok: false; errors: string[] };

export class FlierDocError extends Error {
  public readonly errors: string[];

  public constructor(errors: string[]) {
    super(`Invalid flier: ${errors.join('; ')}`);
    this.name = 'FlierDocError';
    this.errors = errors;
  }
}

/** Checks any input (form, preset file, LLM output) against the FlierDoc schema; errors read "path: problem". */
export function validateFlierDoc(input: unknown): FlierDocResult {
  if (typeName(input) !== 'object') {
    return { ok: false, errors: ['doc: must be an object'] };
  }
  const errors: string[] = [];
  validateAgainst(flierDocSchema, input, '', errors);
  const doc = input as FlierDoc;
  if (doc.layout === LayoutId.List && (doc.items === undefined || doc.items.length === 0)) {
    errors.push('items: layout "list" needs at least one item');
  }
  return errors.length === 0 ? { ok: true, doc } : { ok: false, errors };
}

export function missingAssets(doc: FlierDoc, assets: PosterAssets): string[] {
  const errors: string[] = [];
  if (doc.picture && assets[doc.picture.imageId] === undefined) {
    errors.push(`picture.imageId: no asset named "${doc.picture.imageId}"`);
  }
  if (doc.logo && assets[doc.logo.imageId] === undefined) {
    errors.push(`logo.imageId: no asset named "${doc.logo.imageId}"`);
  }
  return errors;
}
