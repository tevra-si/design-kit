import test from 'node:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import { compareImages } from '../../packages/visual-testing/src/compare.js';
import { capture } from '../../packages/visual-testing/src/capture.js';
import { defaultConfig } from '../../packages/core/src/config.js';

function image(width: number, height: number, color: number): Buffer { const png = new PNG({ width, height }); png.data.fill(color); for (let offset = 3; offset < png.data.length; offset += 4) png.data[offset] = 255; return PNG.sync.write(png); }
test('identical screenshots pass and real changes create a nonempty PNG diff', () => {
  const original = image(20, 20, 255); assert.equal(compareImages(original, original, 0.1, 0).ratio, 0);
  const changed = compareImages(original, image(20, 20, 0), 0.1, 0.01);
  assert.equal(changed.passed, false); assert.ok(changed.differentPixels > 0); assert.equal(PNG.sync.read(changed.png).width, 20);
});
test('dimension differences fail regardless of a permissive ratio threshold', () => {
  const result = compareImages(image(20, 20, 255), image(21, 20, 255), 0.1, 1); assert.equal(result.sizeMismatch, true); assert.equal(result.passed, false);
});
test('invalid and oversized PNG headers are rejected before decoding untrusted image allocations', () => {
  assert.throws(() => compareImages(Buffer.from('not a PNG'), image(20, 20, 255), 0.1, 0), /header/u);
  const huge = Buffer.alloc(24); huge.write('89504e470d0a1a0a', 0, 'hex'); huge.write('IHDR', 12); huge.writeUInt32BE(100000, 16); huge.writeUInt32BE(100000, 20);
  assert.throws(() => compareImages(huge, image(20, 20, 255), 0.1, 0), /limit/u);
});
test('untrusted project configuration cannot execute a custom browser without explicit authorization', async () => {
  await assert.rejects(capture('/unused', { ...defaultConfig, browser: { executablePath: '/tmp/untrusted-program' } }, 'current', 0), /authorization/u);
});
