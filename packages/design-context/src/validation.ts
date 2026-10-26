import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Ajv2020 } from 'ajv/dist/2020.js';
import type { ValidateFunction } from 'ajv';
import { kitRoot } from '../../filesystem/src/resources.js';

const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addFormat('uri-reference', { type: 'string', validate: (value: string) => !/\s/u.test(value) });
ajv.addFormat('date-time', { type: 'string', validate: (value: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value) && Number.isFinite(Date.parse(value)) });
const validators = new Map<string, ValidateFunction>();

export function validate<T>(schema: string, value: unknown): T {
  let checker = validators.get(schema);
  if (!checker) {
    const definition: unknown = JSON.parse(readFileSync(resolve(kitRoot(), 'schemas', schema), 'utf8'));
    if (!definition || typeof definition !== 'object') throw new Error(`Invalid bundled schema ${schema}`);
    checker = ajv.compile(definition);
    validators.set(schema, checker);
  }
  if (!checker(value)) throw new Error(`${schema}: ${ajv.errorsText(checker.errors, { separator: '; ' })}`);
  return value as T;
}
