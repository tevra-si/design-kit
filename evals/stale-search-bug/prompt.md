---
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

Users report that our product search sometimes shows results for the previous query: they type "lap", then quickly "laptop", and end up looking at the results for "lap". It does not happen every time. Find the bug and fix it.

```tsx
export function ProductSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    fetch(`/api/products?q=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(setResults);
  }, [query]);

  return (
    <>
      <input aria-label="Search products" value={query} onChange={event => setQuery(event.target.value)} />
      <ul>{results.map(product => <li key={product.id}>{product.name}</li>)}</ul>
    </>
  );
}
```
