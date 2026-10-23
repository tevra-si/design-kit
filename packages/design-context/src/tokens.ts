import type { DesignContext, TokenMap } from '../../contracts/src/index.js';

export function contrastRatio(first: string, second: string): number {
  function luminance(hex: string): number {
    if (!/^#[\da-f]{6}$/iu.test(hex)) throw new Error('Contrast input must be a six-digit hex color');
    const channels = [1, 3, 5].map(offset => { const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255; return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4; });
    return (channels[0] ?? 0) * 0.2126 + (channels[1] ?? 0) * 0.7152 + (channels[2] ?? 0) * 0.0722;
  }
  const left = luminance(first); const right = luminance(second); return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
}

export function createFoundation(brand = '#175a44'): DesignContext['tokens'] {
  if (!/^#[\da-f]{6}$/iu.test(brand)) throw new Error('Brand color must be a six-digit hex color');
  return {
    primitive: { 'color.brand': brand, 'color.ink': '#17231e', 'color.paper': '#fbfcf9', 'color.white': '#ffffff', 'space.1': '0.25rem', 'space.2': '0.5rem', 'space.3': '0.75rem', 'space.4': '1rem', 'space.6': '1.5rem', 'space.8': '2rem', 'radius.control': '0.5rem', 'type.body': '1rem', 'type.title': 'clamp(1.75rem, 3vw, 2.75rem)', 'motion.feedback': '160ms', 'motion.enter': '240ms', 'motion.ease': 'cubic-bezier(0.2, 0, 0, 1)', 'shadow.panel': '0 2px 12px rgb(0 0 0 / 0.08)' },
    semantic: { 'color.accent': '{primitive.color.brand}', 'color.on-accent': contrastRatio(brand, '#ffffff') >= 4.5 ? '#ffffff' : '#000000', 'color.text': '{primitive.color.ink}', 'color.canvas': '{primitive.color.paper}', 'color.surface': '{primitive.color.white}', 'color.focus': '#145bb5', 'color.danger': '#b42318', 'type.body': '{primitive.type.body}', 'type.heading': '{primitive.type.title}' },
    component: { 'button.radius': '{primitive.radius.control}', 'button.padding': '{primitive.space.3}', 'button.primary.background': '{semantic.color.accent}', 'button.primary.text': '{semantic.color.on-accent}', 'button.disabled.opacity': '0.6', 'panel.shadow': '{primitive.shadow.panel}' },
    themes: { light: { 'color.text': '#17231e', 'color.canvas': '#fbfcf9', 'color.surface': '#ffffff', 'color.accent': brand, 'color.on-accent': contrastRatio(brand, '#ffffff') >= 4.5 ? '#ffffff' : '#000000' }, dark: { 'color.text': '#e8f0eb', 'color.canvas': '#111a16', 'color.surface': '#1b2922', 'color.accent': '#88d4af', 'color.on-accent': '#111a16', 'color.focus': '#9fc6ff', 'color.danger': '#ffb4ab' } },
    responsive: { 'breakpoint.tablet': '48rem', 'breakpoint.desktop': '80rem', 'content.max': '76rem', 'type.title': 'clamp(1.75rem, 3vw, 2.75rem)' }
  };
}
export function exportTokens(tokens: DesignContext['tokens']): { css: string; tailwind: string; portable: string } {
  const flat: TokenMap = {};
  for (const layer of ['primitive', 'semantic', 'component', 'responsive'] as const) for (const [key, value] of Object.entries(tokens[layer])) flat[`${layer}.${key}`] = value;
  const cssName = (name: string): string => `--tevra-${name.replace(/\./gu, '-')}`;
  if (new Set(Object.keys(flat).map(cssName)).size !== Object.keys(flat).length) throw new Error('Token names collide after CSS variable normalization');
  const active = new Set<string>();
  function value(name: string): string {
    if (active.has(name)) throw new Error(`Cyclic token reference: ${name}`);
    const raw = flat[name]; if (raw === undefined) throw new Error(`Missing token reference: ${name}`);
    const reference = /^\{([a-zA-Z0-9_.-]+)\}$/u.exec(raw);
    if (reference?.[1]) { active.add(name); value(reference[1]); active.delete(name); return `var(${cssName(reference[1])})`; }
    if (/[;{}<>@]/u.test(raw)) throw new Error(`Unsafe CSS token value: ${name}`);
    return raw;
  }
  const declarations = Object.keys(flat).map(name => `  ${cssName(name)}: ${value(name)};`).join('\n');
  let css = `:root {\n${declarations}\n}\n`;
  for (const [theme, entries] of Object.entries(tokens.themes)) {
    if (!/^[a-z][a-z0-9-]*$/u.test(theme)) throw new Error(`Unsafe theme name: ${theme}`);
    const declarations = Object.entries(entries).map(([name, raw]) => {
      flat[`theme.${name}`] = raw;
      return `  ${cssName(`semantic.${name}`)}: ${value(`theme.${name}`)};`;
    }).join('\n');
    css += `[data-theme="${theme}"] {\n${declarations}\n}\n`;
    if (theme === 'dark') css += `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${declarations}\n  }\n}\n`;
  }
  const theme = Object.keys(tokens.semantic).filter(name => /^(color|type)\./u.test(name)).map(name => `  --${name.replace(/^type\./u, 'text.').replace(/\./gu, '-')}: var(${cssName(`semantic.${name}`)});`).join('\n');
  return { css, tailwind: `@import "tailwindcss";\n@import "./tokens.css";\n@theme inline {\n${theme}\n}\n`, portable: `${JSON.stringify({ version: 1, layers: tokens }, null, 2)}\n` };
}
