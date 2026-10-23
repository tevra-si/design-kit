import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function kitRoot(): string {
  let current = dirname(fileURLToPath(import.meta.url));
  while (dirname(current) !== current) {
    if (existsSync(resolve(current, 'skills')) && existsSync(resolve(current, 'schemas/design-context.schema.json'))) return current;
    current = dirname(current);
  }
  throw new Error('Kit resources missing; install the complete Tevra package');
}
