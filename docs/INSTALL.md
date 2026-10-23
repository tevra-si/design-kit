# Installing Tevra Design Kit

Current guide: [installation.md](installation.md). Runnable examples: [examples/README.md](../examples/README.md). Commands and environment limits: [workflows.md](workflows.md), [verification.md](verification.md).

The v1 Python validator is kept for compatibility:

```sh
python3 scripts/validate_context.py examples/design-context.json
python3 -m unittest discover -s tests -p 'test_*.py' -v
```

The TypeScript CLI supports the new schema and migration. Do not replace existing tokens/design systems just because kit examples use different values.
