import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gitSubject } from '../../packages/quality-engine/src/git-subject.js';

const git = (cwd: string, ...args: string[]): string => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], { cwd, encoding: 'utf8' }).trim();
async function repository(t: { after: (fn: () => Promise<void>) => void }): Promise<string> {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'tevra-git-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  git(root, 'init', '-q', '-b', 'main'); await writeFile(join(root, 'a.txt'), 'a'); git(root, 'add', '.'); git(root, 'commit', '-qm', 'init');
  return root;
}

test('the report subject is read from .git without spawning git: branch, packed refs and detached HEAD', async t => {
  const root = await repository(t); const commit = git(root, 'rev-parse', 'HEAD');
  assert.deepEqual(await gitSubject(root), { commit, branch: 'main' });
  await mkdir(join(root, 'src')); assert.deepEqual(await gitSubject(join(root, 'src')), { commit, branch: 'main' });
  git(root, 'pack-refs', '--all'); assert.deepEqual(await gitSubject(root), { commit, branch: 'main' });
  git(root, 'checkout', '-q', '--detach'); assert.deepEqual(await gitSubject(root), { commit });
});

test('a linked worktree reports its own branch and commit', async t => {
  const root = await repository(t); const worktree = `${root}-linked`; t.after(() => rm(worktree, { recursive: true, force: true }));
  git(root, 'worktree', 'add', '-q', '-b', 'feature', worktree);
  await writeFile(join(worktree, 'b.txt'), 'b'); git(worktree, 'add', '.'); git(worktree, 'commit', '-qm', 'more');
  assert.deepEqual(await gitSubject(worktree), { commit: git(worktree, 'rev-parse', 'HEAD'), branch: 'feature' });
});

test('there is no subject outside a git repository or when HEAD is unreadable', async t => {
  const plain = await realpath(await mkdtemp(join(tmpdir(), 'tevra-plain-'))); t.after(() => rm(plain, { recursive: true, force: true }));
  assert.equal(await gitSubject(plain), null);
  await mkdir(join(plain, '.git')); await writeFile(join(plain, '.git', 'HEAD'), 'ref: refs/heads/../../etc/passwd\n');
  assert.equal(await gitSubject(plain), null);
});
