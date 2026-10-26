import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { kitRoot } from '../../filesystem/src/resources.js';

export interface Pattern { id: string; category: string; tags: string[]; recommendation: string; source: string; confidence: string; license: string }
function terms(text: string): string[] { return text.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []; }
export async function searchPatterns(query: string, category?: string, limit = 5): Promise<(Pattern & { score: number })[]> {
  if (!query.trim() || !Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error('Search needs a query and a result limit between 1 and 20');
  const input: unknown = JSON.parse(await readFile(resolve(kitRoot(), 'references/ux-patterns/catalog.json'), 'utf8'));
  if (!Array.isArray(input)) throw new Error('Invalid bundled pattern catalog');
  const patterns = input.map((entry: unknown): Pattern => {
    if (!entry || typeof entry !== 'object' || !('id' in entry) || !('category' in entry) || !('tags' in entry) || !('recommendation' in entry) || !('source' in entry) || !('confidence' in entry) || !('license' in entry) || ![entry.id, entry.category, entry.recommendation, entry.source, entry.confidence, entry.license].every(value => typeof value === 'string') || !Array.isArray(entry.tags) || !entry.tags.every(value => typeof value === 'string')) throw new Error('Invalid pattern catalog record');
    return entry as Pattern;
  }).filter(pattern => !category || pattern.category === category);
  const documents = patterns.map(pattern => terms(`${pattern.category} ${pattern.tags.join(' ')} ${pattern.recommendation}`));
  const averageLength = documents.reduce((sum, tokens) => sum + tokens.length, 0) / (documents.length || 1);
  const queryTerms = [...new Set(terms(query))];
  const frequencies = new Map(queryTerms.map(term => [term, documents.filter(tokens => tokens.includes(term)).length]));
  return patterns.map((pattern, index) => {
    const tokens = documents[index] ?? [];
    const score = queryTerms.reduce((sum, term) => {
      const frequency = tokens.filter(token => token === term).length;
      const matched = frequencies.get(term) ?? 0;
      const inverseFrequency = Math.log(1 + (documents.length - matched + 0.5) / (matched + 0.5));
      return sum + inverseFrequency * frequency * 2.2 / (frequency + 1.2 * (0.25 + 0.75 * tokens.length / averageLength));
    }, 0);
    return { ...pattern, score };
  }).filter(pattern => pattern.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit);
}
