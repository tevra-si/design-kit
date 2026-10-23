import { parseArgs } from 'node:util';

const boolean = { type: 'boolean' } as const;
const string = { type: 'string' } as const;
const specs: Record<string, Record<string, typeof boolean | typeof string>> = {
  init: { agents: string, yes: boolean, 'skip-skills': boolean }, doctor: { launch: boolean, 'allow-custom-browser': boolean }, analyze: {},
  'skills list': { registry: string }, 'skills inspect': { registry: string }, 'skills validate': { registry: string }, 'skills graph': { registry: string }, 'skills check': {}, 'skills install': { agents: string, 'dry-run': boolean },
  validate: {}, 'context show': {}, 'context validate': {}, 'context migrate': { out: string, owner: string }, 'context update': { revision: string, 'approve-constraints': boolean },
  'memory inspect': {}, 'memory list': {}, 'memory update': { revision: string }, 'memory reset': { yes: boolean },
  'workflow plan': { registry: string, mode: string, 'max-steps': string, 'max-minutes': string, 'max-refinements': string, out: string },
  'workflow run': { 'allow-network': boolean, 'allow-custom-browser': boolean },
  plan: { registry: string, mode: string, 'max-steps': string, 'max-minutes': string, 'max-refinements': string, out: string },
  'workflow status': {}, 'workflow start': { skill: string }, 'workflow complete': { skill: string, evidence: string }, 'workflow fail': { skill: string, evidence: string }, 'workflow approve': { by: string, yes: boolean },
  'handoff validate': {}, 'handoff save': {}, search: { category: string, limit: string },
  'tokens generate': { 'new-system': boolean, brand: string }, 'tokens export': {},
  'test performance': { 'allow-network': boolean, 'allow-custom-browser': boolean, 'lcp-ms': string, cls: string, 'tbt-ms': string },
  'test browser': { 'allow-custom-browser': boolean }, 'test visual': { 'allow-custom-browser': boolean }, 'test accessibility': { 'allow-custom-browser': boolean },
  capture: { kind: string, 'approve-baseline': boolean, 'allow-custom-browser': boolean }, compare: {}, a11y: { 'allow-custom-browser': boolean },
  report: { checks: string, out: string }, review: { checks: string, out: string, 'allow-custom-browser': boolean }, help: {}
};
export interface Arguments { command: string; positional: string[]; flags: Record<string, string | boolean | undefined> }
export function parseCLI(argv: string[]): Arguments {
  const words = [...argv]; let command = words.shift() ?? 'help';
  if (command === '--help' || command === '-h') command = 'help';
  if (['skills', 'context', 'memory', 'workflow', 'handoff', 'tokens', 'test'].includes(command)) command += ` ${words.shift() ?? ''}`;
  const specification = specs[command]; if (!specification) throw new Error(`Unknown command: ${command}. Use tevra-design help.`);
  const result = parseArgs({ args: words, options: { ...specification, root: string, help: boolean }, allowPositionals: true, strict: true });
  if (!result.values.help && command !== 'help') {
    const single = ['skills inspect', 'workflow run', 'context migrate', 'context update', 'memory update', 'workflow status', 'workflow start', 'workflow complete', 'workflow fail', 'workflow approve', 'handoff validate', 'handoff save'];
    const count = result.positionals.length;
    if (single.includes(command) ? count !== 1 : ['plan', 'workflow plan', 'search'].includes(command) ? count < 1 : command === 'validate' ? count > 1 : count !== 0) throw new Error(`Unexpected positional arguments for ${command}`);
  }
  return { command: result.values.help ? 'help' : command, positional: result.positionals, flags: result.values };
}
export function flag(args: Arguments, name: string, fallback?: string): string {
  const value = args.flags[name]; if (typeof value === 'string') return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`--${name} is required`);
}
export function numeric(args: Arguments, name: string, fallback?: number): number {
  const value = Number(flag(args, name, fallback?.toString()));
  if (!Number.isFinite(value)) throw new Error(`--${name} must be a finite number`); return value;
}
export function inputPath(args: Arguments): string {
  if (args.positional.length !== 1 || !args.positional[0]) throw new Error('Expected exactly one project-relative input file');
  return args.positional[0];
}
