/* Tiny pub/sub so the film tick can push progress to chrome without React re-renders. */

type Sub = (p: number) => void;

const subs = new Set<Sub>();

export function subscribeProgress(fn: Sub): () => void {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

export function emitProgress(p: number) {
  subs.forEach((f) => f(p));
}

/* Shared stage state. While the awakening film fully covers the screen the
   strand world underneath is invisible, so it skips rendering entirely. */
export const stageState = { awakeningOpaque: true };
