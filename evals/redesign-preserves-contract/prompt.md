---
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

Make this pricing card look more modern. Show me the updated component. Our design system already exposes these CSS variables: `--color-accent`, `--color-surface`, `--color-text`, `--radius-control`, `--space-4`. The card is used by other teams.

```tsx
type Props = { planId: string; name: string; priceCents: number; currency: 'USD' | 'VND'; onSelect: (planId: string) => void };

export function PricingCard({ planId, name, priceCents, currency, onSelect }: Props) {
  const price = new Intl.NumberFormat(currency === 'VND' ? 'vi-VN' : 'en-US', { style: 'currency', currency }).format(priceCents / 100);
  return (
    <div className="card">
      <h3>{name}</h3>
      <p>{price} / month</p>
      <button onClick={() => onSelect(planId)}>Choose {name}</button>
    </div>
  );
}
```
