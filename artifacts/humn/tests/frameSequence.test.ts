import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createFrameSequence, frameWindow } from '../src/film/frameSequence.ts';

// Node has no browser bitmap API; each test restores its mock.
Object.defineProperty(globalThis, 'createImageBitmap', { value: undefined, configurable: true, writable: true });

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

test('frame window never requests more frames than it can retain, including both edges', () => {
  for (const first of [0, 300]) {
    for (const center of [first, first + 1, 360, 477, 478]) {
      for (const direction of [-1, 1]) {
        const window = frameWindow(center, direction, first, 478, 16);
        assert.equal(window.length, 16);
        assert.equal(new Set(window).size, 16);
        assert.equal(window[0], center);
        assert.ok(window.every((i) => i >= first && i <= 478));
      }
    }
  }
});

test('decoder settles when idle, reprioritizes seeks, and releases all bitmaps', async (t) => {
  let decodes = 0;
  let live = 0;
  let peak = 0;
  const requests: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    requests.push(url);
    return { ok: true, blob: async () => new Blob(['frame']) };
  });
  t.mock.property(globalThis, 'createImageBitmap', async () => {
    decodes++;
    live++;
    peak = Math.max(peak, live);
    return { width: 1280, height: 718, close() { live--; } };
  });
  const sequence = createFrameSequence({ first: 0, count: 479, capacity: 16,
    concurrency: 3, previews: false, url: (i) => `/frame/${i}`, onFrame() {} });
  sequence.setActive(true);
  await flush();
  assert.equal(decodes, 1, 'arrival decodes only the opening frame');
  sequence.seek(200);
  await flush();
  assert.ok(sequence.get(200));
  const settled = decodes;
  for (let i = 0; i < 20; i++) sequence.seek(200);
  await flush();
  assert.equal(decodes, settled, 'a stationary playhead never churns the cache');
  sequence.seek(478);
  sequence.seek(100);
  sequence.seek(300);
  await flush();
  assert.ok(sequence.get(300));
  assert.ok(peak <= 19, 'retained frames plus at most three in-flight decodes');
  sequence.setActive(false);
  sequence.seek(400);
  await flush();
  assert.equal(sequence.get(400), undefined);
  sequence.setActive(true);
  await flush();
  assert.ok(sequence.get(400));
  sequence.dispose();
  await flush();
  assert.equal(live, 0);
  assert.ok(requests.length < 100, 'never eager-fetch the entire film');
});

test('failed frames do not create an infinite retry loop', async (t) => {
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => { requests++; return new Response('', { status: 404 }); });
  const sequence = createFrameSequence({ first: 300, count: 479, capacity: 16,
    concurrency: 3, previews: false, url: (i) => `/frame/${i}`, onFrame() {} });
  sequence.setActive(true);
  await flush();
  sequence.seek(300);
  await flush();
  assert.equal(requests, 1);
  assert.equal(sequence.nearest(300), undefined);
  sequence.dispose();
});

test('late decode after disposal is closed and cannot notify the component', async (t) => {
  let resolveDecode: (value: unknown) => void = () => {};
  let closed = false;
  let notifications = 0;
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, blob: async () => new Blob(['frame']) }));
  t.mock.property(globalThis, 'createImageBitmap', () => new Promise((resolve) => { resolveDecode = resolve; }));
  const sequence = createFrameSequence({ first: 0, count: 479, capacity: 16,
    concurrency: 3, url: (i) => `/frame/${i}`, onFrame() { notifications++; } });
  sequence.setActive(true);
  await flush();
  sequence.dispose();
  resolveDecode({ width: 1280, height: 718, close() { closed = true; } });
  await flush();
  assert.equal(closed, true);
  assert.equal(notifications, 0);
});
