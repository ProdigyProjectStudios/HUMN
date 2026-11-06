/* HUMN — film configuration. All visitor-facing film copy lives here. */

export const INK = '#05070B';
export const CREAM = '#F5EEE3';

export const CHAPTERS = [
  { id: 'origin', label: 'ORIGIN' },
  { id: 'leaps', label: 'LEAPS' },
  { id: 'memory', label: 'MEMORY' },
  { id: 'intuition', label: 'INTUITION' },
  { id: 'judgment', label: 'JUDGMENT' },
  { id: 'evolve', label: 'EVOLVE' },
] as const;

/* One chapter per sixth of the strand film. The product is HUMN Thread: a
   non-invasive neural interface (behind-the-ear band, no implant) with a
   personal AI that extends memory, speed and judgment rather than replacing
   them. Two "lineage" chapters (why now), three "faculty" chapters (what it
   does), then the product reveal. */
export interface Fact {
  value: string;
  label: string;
}
export interface Chapter {
  kicker: string;
  lines: string[]; // headline, one entry per line; <em> allowed
  facts: Fact[];
  sub?: string;
  final?: boolean;
}

export const CHAPTER_COPY: Chapter[] = [
  {
    kicker: 'Four billion years in the making',
    lines: ['Biology wrote', 'the <em>first code.</em>'],
    facts: [
      { value: '3.2 billion', label: 'base pairs of instructions' },
      { value: '86 billion', label: 'neurons, wired by evolution' },
      { value: 'One', label: 'mind, working alone' },
    ],
  },
  {
    kicker: 'Every leap since',
    lines: ['Every leap since', 'was a tool we', 'had <em>to hold.</em>'],
    facts: [
      { value: '3200 BC', label: 'Writing — memory outside the mind' },
      { value: '1440', label: 'Print — knowledge at scale' },
      { value: '1947', label: 'Silicon — thought at speed' },
    ],
  },
  {
    kicker: 'Memory',
    lines: ['Remember', '<em>everything</em> that', 'ever mattered.'],
    facts: [
      { value: 'Total recall', label: 'every conversation, page and decision' },
      { value: 'In context', label: 'surfaced the moment it’s relevant' },
      { value: 'Yours alone', label: 'encrypted on the band, never sold' },
    ],
  },
  {
    kicker: 'Intuition',
    lines: ['Think at the', '<em>speed</em> of thought.'],
    facts: [
      { value: '180 ms', label: 'from intent to answer' },
      { value: 'Zero screens', label: 'no keyboard, no wake word' },
      { value: 'A whisper', label: 'bone-conducted, heard only by you' },
    ],
  },
  {
    kicker: 'Judgment',
    lines: ['Sharper judgment.', '<em>Still yours.</em>'],
    facts: [
      { value: 'Reasoning shown', label: 'every answer explains itself' },
      { value: 'Doubt flagged', label: 'it tells you when it doesn’t know' },
      { value: 'Final say', label: 'the decision is always yours' },
    ],
  },
  {
    kicker: 'HUMN Thread',
    lines: ['Evolve.'],
    sub: 'The first neural interface that needs no implant. It learns how you think, then helps you think further.',
    facts: [
      { value: '14 g', label: 'worn behind the ear' },
      { value: 'No implant', label: 'no surgery, ever' },
      { value: '2027', label: 'first units ship' },
    ],
    final: true,
  },
];

/* The five story chapters share the first 80% of the strand film; the reveal
   gets the rest: "Evolve." holds on the dark world while light ripples out of
   the point, then the light floods the frame (world.ts) and settles to ink. */
export const CHAPTER_SPAN = 0.16;
export const REVEAL = { a: 0.815, b: 0.87, c: 0.925, d: 0.952 };
export const FLOOD = { from: 0.925, peak: 0.968 };

export function chapterWindow(i: number) {
  const n = CHAPTER_COPY.length;
  if (i === n - 1) return REVEAL;
  const s = i * CHAPTER_SPAN;
  const e = s + CHAPTER_SPAN;
  if (i === 0) return { a: 0.012, b: 0.08, c: e - 0.04, d: e - 0.006 };
  return { a: s + 0.008, b: s + 0.066, c: e - 0.04, d: e - 0.006 };
}

/* which chapter the header names at film progress p, and how far through */
export function chapterAt(p: number) {
  const n = CHAPTER_COPY.length;
  const story = (n - 1) * CHAPTER_SPAN;
  if (p >= story) return { idx: n - 1, local: clamp((p - story) / (1 - story)) };
  const idx = Math.floor(p / CHAPTER_SPAN);
  return { idx, local: p / CHAPTER_SPAN - idx };
}

export const FILM_VH = 820;

/* The awakening film dissolves straight into the strand film: for this much
   scroll both stages are pinned together, the awakening on top fading out. */
export const AWAKENING_XFADE_VH = 50;

export function clamp(v: number, lo = 0, hi = 1) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/* Fade envelope: 0 outside [a,d], ramps a→b up, d←c down. out > 1.5 = finale. */
export function envelope(
  p: number,
  a: number,
  b: number,
  c: number,
  d: number,
) {
  if (p < a || p > d) return 0;
  if (p < b) return (p - a) / Math.max(1e-4, b - a);
  if (d > 1.5) return 1;
  if (p > c) return 1 - (p - c) / Math.max(1e-4, d - c);
  return 1;
}
