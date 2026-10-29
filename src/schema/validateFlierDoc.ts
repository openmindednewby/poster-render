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

function sameLineTies(doc: FlierDoc): number[] {
  const ties: unknown = doc.lineTies;
  if (!Array.isArray(ties)) {
    return [];
  }
  return ties.flatMap((tie: { lines?: unknown }, i) => (Array.isArray(tie?.lines) && tie.lines.length === 2 && tie.lines[0] === tie.lines[1] ? [i] : []));
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
  sameLineTies(doc).forEach((i) => errors.push(`lineTies[${i}].lines: must name two different lines`));
  return errors.length === 0 ? { ok: true, doc } : { ok: false, errors };
}

export function missingAssets(doc: FlierDoc, assets: PosterAssets): string[] {
  const errors: string[] = [];
  if (doc.picture && !Object.hasOwn(assets, doc.picture.imageId)) {
    errors.push(`picture.imageId: no asset named "${doc.picture.imageId}"`);
  }
  if (doc.logo && !Object.hasOwn(assets, doc.logo.imageId)) {
    errors.push(`logo.imageId: no asset named "${doc.logo.imageId}"`);
  }
  return errors;
}
