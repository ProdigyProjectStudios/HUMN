/** A demand-driven, bounded decoder. A settled playhead must settle the queue too. */
export function frameWindow(center: number, direction: number, first: number, last: number, size: number) {
  const order = [center];
  for (let distance = 1; order.length < size && distance <= last - first; distance++) {
    // Favour the direction of travel without starving reverse scrolling.
    for (const index of [center + distance * direction, center - distance * direction]) {
      if (index >= first && index <= last && order.length < size) order.push(index);
    }
  }
  return order;
}

export type Frame = {
  image: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

async function decode(blob: Blob, width?: number): Promise<Frame> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob, width ? { resizeWidth: width, resizeQuality: 'low' } : undefined);
      if (!width || bitmap.width <= width) {
        return { image: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
      }
      bitmap.close(); // Older WebKit may ignore ImageBitmap resize options.
    } catch { /* Image decoding below also supports older Safari. */ }
  }
  const url = URL.createObjectURL(blob);
  const image = new Image();
  try {
    image.src = url;
    await image.decode();
    if (width) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = Math.round(width * image.naturalHeight / image.naturalWidth);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      image.src = '';
      return { image: canvas, width: canvas.width, height: canvas.height, close: () => { canvas.width = canvas.height = 0; } };
    }
    return { image, width: image.naturalWidth, height: image.naturalHeight, close: () => { image.src = ''; } };
  } finally {
    URL.revokeObjectURL(url);
  }
}

type Options = {
  first: number;
  count: number;
  capacity: number;
  concurrency: number;
  url: (index: number) => string;
  onFrame: () => void;
  previews?: boolean;
};

export function createFrameSequence(options: Options) {
  const { first, count, capacity, concurrency, url, onFrame } = options;
  const last = count - 1;
  const full = new Map<number, Frame>();
  const previews = new Map<number, Frame>();
  const blobs = new Map<number, Blob>();
  const pending = new Map<string, AbortController>();
  const failures = new Set<string>();
  const previewIndices = [first];
  for (let i = first + 16; i < last; i += 16) previewIndices.push(i);
  previewIndices.push(last);
  let center = first;
  let direction = 1;
  let wanted = [first];
  let active = false;
  let disposed = false;
  let interacted = false;

  const prune = () => {
    for (const [index, frame] of full) {
      if (!wanted.includes(index)) {
        frame.close();
        full.delete(index);
      }
    }
  };

  async function load(index: number, preview: boolean) {
    const key = `${preview ? 'preview' : 'full'}:${index}`;
    const controller = new AbortController();
    pending.set(key, controller);
    try {
      let blob = blobs.get(index);
      if (!blob) {
        const response = await fetch(url(index), { signal: controller.signal });
        if (!response.ok) throw new Error(`Frame HTTP ${response.status}`);
        blob = await response.blob();
      }
      if (disposed || controller.signal.aborted) return;
      blobs.delete(index);
      blobs.set(index, blob);
      while (blobs.size > 64) blobs.delete(blobs.keys().next().value!);
      const frame = await decode(blob, preview ? 480 : undefined);
      if (disposed || !active || controller.signal.aborted || (!preview && !wanted.includes(index))) {
        frame.close();
        return;
      }
      (preview ? previews : full).set(index, frame);
      onFrame();
    } catch {
      // Do not turn a missing/corrupt asset into an endless fetch/decode loop.
      if (!controller.signal.aborted) failures.add(key);
    } finally {
      pending.delete(key);
      pump();
    }
  }

  function pump() {
    if (!active || disposed) return;
    const eligible = (i: number, preview: boolean) => {
      const key = `${preview ? 'preview' : 'full'}:${i}`;
      return !(preview ? previews : full).has(i) && !pending.has(key) && !failures.has(key);
    };
    while (pending.size < concurrency) {
      const index = wanted.find((i) => eligible(i, false));
      if (index !== undefined) { void load(index, false); continue; }
      // Sparse previews only after interaction; never download the whole film on arrival.
      const preview = interacted && options.previews !== false
        ? previewIndices.find((i) => eligible(i, true)) : undefined;
      if (preview === undefined) break;
      void load(preview, true);
    }
  }

  return {
    seek(index: number) {
      const next = Math.max(first, Math.min(last, Math.floor(index)));
      if (next !== center) {
        direction = next > center ? 1 : -1;
        center = next;
        interacted = true;
        wanted = frameWindow(center, direction, first, last, capacity);
        // Obsolete full-frame work must not block a fast flick to a new location.
        for (const [key, controller] of pending) {
          if (key.startsWith('full:') && !wanted.includes(Number(key.slice(5)))) controller.abort();
        }
        // Keep the last displayed frame until its replacement lands; the canvas owns its pixels.
        prune();
      }
      pump();
    },
    get(index: number) { return full.get(index); },
    nearest(index: number) {
      let best: Frame | undefined;
      let distance = Infinity;
      for (const cache of [full, previews]) {
        for (const [i, frame] of cache) {
          if (Math.abs(i - index) < distance) { best = frame; distance = Math.abs(i - index); }
        }
      }
      return best;
    },
    setActive(value: boolean) {
      active = value;
      if (active) pump();
      else for (const controller of pending.values()) controller.abort();
    },
    dispose() {
      disposed = true;
      for (const controller of pending.values()) controller.abort();
      for (const frame of [...full.values(), ...previews.values()]) frame.close();
      full.clear();
      previews.clear();
      blobs.clear();
    },
  };
}
