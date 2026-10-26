import test from 'node:test';
import assert from 'node:assert/strict';
import { createTask } from '../../examples/shared/task-model.js';

test('shared example task boundary validates meaningful titles and preserves supplied IDs', () => {
  assert.equal(createTask(' x ', 'id').ok, false); assert.equal(createTask('x'.repeat(121), 'id').ok, false); assert.equal(createTask('Valid title', '').ok, false);
  assert.deepEqual(createTask('  Review keyboard flow  ', 'keyboard'), { ok: true, task: { id: 'keyboard', title: 'Review keyboard flow', completed: false } });
});
