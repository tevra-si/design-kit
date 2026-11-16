import { readFile, realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { criterionIds } from '../../contracts/src/index.js';
import { isMissing, safePath } from '../../filesystem/src/index.js';

export interface SpecKitFeature { feature: string; hasSpec: boolean; hasPlan: boolean; acceptance: string[] }

async function readOptional(root: string, path: string): Promise<string | null> {
  try { return await readFile(await safePath(root, path), 'utf8'); } catch (error) { if (isMissing(error)) return null; throw error; }
}

// Scenario 2 of user story 1 becomes AC-102, so IDs stay stable while the spec keeps its story order.
function acceptanceScenarios(spec: string): string[] {
  const acceptance: string[] = []; let story = 0; let collecting = false;
  for (const line of spec.split(/\r?\n/u)) {
    const heading = /^###\s+User Story\s+(\d+)\b/u.exec(line);
    if (heading) { story = Number(heading[1]); collecting = false; continue; }
    if (/^#{1,6}\s|^---\s*$/u.test(line)) { collecting = false; continue; }
    if (/^\*\*Acceptance Scenarios\*\*/u.test(line)) { collecting = story > 0; continue; }
    const scenario = collecting ? /^(\d+)\.\s+(.+)$/u.exec(line) : null;
    if (!scenario?.[1] || !scenario[2]) continue;
    const text = scenario[2].replaceAll('**', '').trim();
    // Bracketed text is an unfilled template placeholder or an open clarification, not a testable criterion.
    if (/\[[^\]]+\]/u.test(text)) continue;
    acceptance.push(`AC-${story}${scenario[1].padStart(2, '0')}: ${text}`);
  }
  criterionIds(acceptance, true);
  return acceptance;
}

// Read-only: Tevra never writes into .specify/ or the feature directory.
export async function readSpecKit(root: string): Promise<SpecKitFeature | null> {
  const pointer = await readOptional(root, '.specify/feature.json');
  if (pointer === null) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(pointer); } catch { throw new Error('Spec Kit .specify/feature.json is not valid JSON; repair it or plan with --mode quick'); }
  const directory: unknown = parsed && typeof parsed === 'object' && 'feature_directory' in parsed ? parsed.feature_directory : undefined;
  if (typeof directory !== 'string' || !directory.trim()) throw new Error('Spec Kit .specify/feature.json has no feature_directory; repair it or plan with --mode quick');
  // Both sides are resolved so a symlinked temp or home directory does not look like an escape.
  const absolute = isAbsolute(directory) ? await realpath(resolve(directory)).catch((error: unknown) => { if (isMissing(error)) throw new Error(`Spec Kit feature_directory does not exist: ${directory}`, { cause: error }); throw error; }) : null;
  const feature = (absolute ? relative(await realpath(root), absolute) : directory).replaceAll('\\', '/').replace(/\/$/u, '');
  if (!feature || isAbsolute(feature) || feature.split('/').includes('..')) throw new Error(`Spec Kit feature_directory is outside the project: ${directory}`);
  try { if (!(await stat(await safePath(root, feature))).isDirectory()) throw new Error(`Spec Kit feature_directory is not a directory: ${feature}`); }
  catch (error) { if (isMissing(error)) throw new Error(`Spec Kit feature_directory does not exist: ${feature}`, { cause: error }); throw error; }
  const spec = await readOptional(root, `${feature}/spec.md`);
  return { feature, hasSpec: spec !== null, hasPlan: await readOptional(root, `${feature}/plan.md`) !== null, acceptance: spec === null ? [] : acceptanceScenarios(spec) };
}
