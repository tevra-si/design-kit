---
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

On a 390px-wide phone our orders page scrolls sideways. The culprit is this table with 7 columns. Fix it.

```html
<main>
  <h1>Orders</h1>
  <table class="orders">
    <thead><tr><th>ID</th><th>Customer</th><th>Plan</th><th>Status</th><th>Created</th><th>Total</th><th>Actions</th></tr></thead>
    <tbody><!-- rows --></tbody>
  </table>
</main>
<style>
  .orders { width: 900px; border-collapse: collapse; }
</style>
```
