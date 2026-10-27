---
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

Check this React signup form for accessibility problems and tell me whether it is ready to ship. Brand colors: text `#9aa5a0` on background `#ffffff`.

```tsx
export function SignupForm({ onSubmit }: { onSubmit: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  return (
    <form onSubmit={e => { e.preventDefault(); if (!email.includes('@')) setError('Invalid email'); else onSubmit(email); }}>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ outline: 'none' }} />
      {error && <span className="error" style={{ color: '#9aa5a0' }}>{error}</span>}
      <div className="btn" onClick={() => onSubmit(email)}>Sign up</div>
    </form>
  );
}
```
