import type { Config } from '../../contracts/src/index.js';
import { validate } from '../../design-context/src/validation.js';
import { readJSON } from '../../filesystem/src/index.js';

export const defaultConfig: Config = {
  version: 1, baseURL: 'http://127.0.0.1:4173', permittedOrigins: ['http://127.0.0.1:4173'],
  viewports: [{ name: 'mobile', width: 390, height: 844 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'laptop', width: 1280, height: 800 }, { name: 'desktop', width: 1440, height: 900 }],
  routes: [{ name: 'home', path: '/', states: [{ name: 'default', actions: [], masks: [] }] }],
  browser: {}, timeoutMs: 15000, thresholds: { diffRatio: 0.01, pixelSensitivity: 0.1, minScore: 75 },
  weights: { hierarchy: 15, typography: 10, layout: 15, consistency: 10, responsive: 15, accessibility: 15, interaction: 0, functional: 10, performance: 10 },
  requiredChecks: ['visual-diff', 'axe', 'overflow', 'functional-tests'], maxRefinements: 2
};
export function validateConfig(value: unknown): Config {
  const config = validate<Config>('config.schema.json', value);
  const base = new URL(config.baseURL);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error('baseURL must be an HTTP(S) URL without credentials, query or fragment');
  for (const origin of config.permittedOrigins) if (new URL(origin).origin !== origin) throw new Error(`Expected exact permitted origin: ${origin}`);
  if (!config.permittedOrigins.includes(base.origin)) throw new Error('baseURL origin is not explicitly permitted');
  for (const route of config.routes) if (!config.permittedOrigins.includes(new URL(route.path, config.baseURL).origin)) throw new Error(`Route escapes permitted origins: ${route.name}`);
  for (const [label, names] of [['viewport', config.viewports.map(viewport => viewport.name)], ['route', config.routes.map(route => route.name)], ...config.routes.map(route => [`state in ${route.name}`, route.states.map(state => state.name)] as const)] as const) {
    if (new Set(names).size !== names.length) throw new Error(`Duplicate ${label} names`);
  }
  for (const route of config.routes) for (const state of route.states) for (const action of state.actions) {
    if ((action.type === 'fill' || action.type === 'press' || action.type === 'expect-text') && action.value === undefined) throw new Error(`${action.type} action requires a value`);
  }
  if (Math.abs(Object.values(config.weights).reduce((sum, weight) => sum + weight, 0) - 100) > 0.001) throw new Error('Quality weights must sum to 100');
  return config;
}
export async function loadConfig(root: string): Promise<Config> { return validateConfig(await readJSON(root, '.tevra/config.json')); }
