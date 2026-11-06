/* HUMN — WebGL world. One continuous ascent through six strata, rendered as a
   procedural GLSL environment + a perspective particle field for true depth.
   Exposes the same { paint(p,t), resize() } contract as the 2D painter so the
   film's choreography, copy and DOM logic are untouched. Falls back to the 2D
   painter (render.ts) when WebGL is unavailable. */

import * as THREE from 'three';
import { clamp } from '../config';

export interface World {
  paint: (p: number, t: number) => void;
  resize: () => void;
  setMouse: (x: number, y: number) => void;
  /* precise mouse position for the strand's hover response (null = gone) */
  setPointer: (x: number | null, y?: number) => void;
  dispose: () => void;
}

/* ————————————————————————— world fragment shader ————————————————————————— */

const WORLD_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uP;
uniform float uTime;
uniform float uRipT;
uniform vec2 uPtr;     /* mouse in uv (0..1, y up) */
uniform float uHover;  /* 0..1, eased presence of a mouse */
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uAspect;

float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

/* Gradient simplex noise. The old value noise sat on a square grid and its
   cell borders showed as faint straight creases in the dark, smooth
   background (the "invisible page breaks", moving as the nebula drifted).
   Simplex kernels are radial, so there is no axis-aligned edge anywhere. */
vec2 g2(vec2 p){
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
float snoise(vec2 p){
  const float K1 = 0.366025404;
  const float K2 = 0.211324865;
  vec2 i = floor(p + (p.x + p.y) * K1);
  vec2 a = p - i + (i.x + i.y) * K2;
  float m = step(a.y, a.x);
  vec2 o = vec2(m, 1.0 - m);
  vec2 b = a - o + K2;
  vec2 c = a - 1.0 + 2.0 * K2;
  vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  vec3 n = h * h * h * h * vec3(dot(a, g2(i)), dot(b, g2(i + o)), dot(c, g2(i + 1.0)));
  return dot(n, vec3(70.0));
}
/* 0..1, same range the scene was tuned for */
float vnoise(vec2 p){
  return 0.5 + 0.5 * snoise(p);
}

/* each octave rotated, so no lattice direction ever lines up across scales */
float fbm(vec2 p){
  float v = 0.0;
  float a = 0.5;
  mat2 r = mat2(1.6, 1.2, -1.2, 1.6);
  for(int i = 0; i < 4; i++){
    v += a * vnoise(p);
    p = r * p + 3.1;
    a *= 0.5;
  }
  return v;
}

/* voronoi: x = F1, y = F2, z = stable cell id */
vec3 voro(vec2 p, float t){
  vec2 ip = floor(p);
  vec2 fp = fract(p);
  float f1 = 8.0;
  float f2 = 8.0;
  float id = 0.0;
  for(int y = -1; y <= 1; y++)
  for(int x = -1; x <= 1; x++){
    vec2 g = vec2(float(x), float(y));
    vec2 o = vec2(h2(ip + g), h2(ip + g + 19.19));
    o = 0.5 + 0.4 * sin(t * 0.6 + 6.2831 * o);
    vec2 r = g + o - fp;
    float d = dot(r, r);
    if(d < f1){ f2 = f1; f1 = d; id = h2(ip + g + 7.7); }
    else if(d < f2){ f2 = d; }
  }
  return vec3(sqrt(f1), sqrt(f2), id);
}

/* wide crossfade feather — chapter boundaries are imperceptible, the world
   flows continuously */
float bandW(float wy, float i){
  return smoothstep(i - 0.14, i + 0.36, wy) * (1.0 - smoothstep(i + 0.64, i + 1.14, wy));
}

float env(float p, float a, float b, float c, float d){
  if(p < a || p > d) return 0.0;
  if(p < b) return (p - a) / max(1e-4, b - a);
  if(d > 1.5) return 1.0;
  if(p > c) return 1.0 - (p - c) / max(1e-4, d - c);
  return 1.0;
}

float easeIO(float t){
  return t < 0.5 ? 2.0 * t * t : 1.0 - pow(-2.0 * t + 2.0, 2.0) / 2.0;
}

/* one continuous material: near-black graphite → warm graphite → umber →
   bronze → cream. Warmth leaks in as light, never as a palette switch. */
vec3 strataColor(float wy){
  vec3 c = mix(vec3(0.016, 0.020, 0.039), vec3(0.027, 0.039, 0.063), smoothstep(0.0, 1.0, wy));
  c = mix(c, vec3(0.047, 0.055, 0.071), smoothstep(1.0, 2.0, wy));
  c = mix(c, vec3(0.078, 0.067, 0.051), smoothstep(2.0, 3.0, wy));
  c = mix(c, vec3(0.114, 0.086, 0.063), smoothstep(3.0, 4.0, wy));
  c = mix(c, vec3(0.188, 0.133, 0.086), smoothstep(4.0, 5.0, wy));
  /* the reveal stays dark so the point of light carries it; the bright
     flood comes afterwards, from the light itself (see FLOOD below) */
  c = mix(c, vec3(0.070, 0.050, 0.036), smoothstep(5.0, 6.0, wy));
  return c;
}

/* the thread's own journey: cold white-blue → silver → champagne → gold →
   warm white — a continuous material shift, never a swap */
vec3 threadColor(float p){
  vec3 c = mix(vec3(0.851, 0.910, 0.957), vec3(0.906, 0.894, 0.863), smoothstep(0.10, 0.35, p));
  c = mix(c, vec3(0.949, 0.867, 0.729), smoothstep(0.35, 0.60, p));
  c = mix(c, vec3(0.965, 0.812, 0.627), smoothstep(0.60, 0.80, p));
  c = mix(c, vec3(1.0, 0.953, 0.875), smoothstep(0.80, 0.92, p));
  return c;
}

void main(){
  vec2 uv = vUv;
  float wy = uv.y + uP * 5.0;
  vec2 sp = vec2(uv.x * uAspect, wy);
  vec3 col = strataColor(wy);

  /* warmth leaks in chapter by chapter — one material, transforming */
  float warm = smoothstep(0.04, 0.85, uP);
  col *= mix(vec3(1.0), vec3(1.07, 0.99, 0.88), warm * 0.55);

  /* tactile grain in the rock itself */
  col *= 0.90 + 0.20 * fbm(sp * 3.0);

  /* deep-space nebula — a faint, continuous body of light behind everything.
     No bands, no edges: pure low-frequency fbm, cool early, warm later. */
  float neb = fbm(sp * 0.85 + vec2(uTime * 0.008, -uTime * 0.004));
  neb = smoothstep(0.42, 0.92, neb);
  vec3 nebC = mix(vec3(0.42, 0.52, 0.66), vec3(0.86, 0.66, 0.44), warm);
  col += nebC * neb * 0.032 * (1.0 - smoothstep(4.7, 5.6, wy));

  /* — THE HELIX, EVOLVING — BEDROCK: a machine strand and a human strand
       tightly intertwined. CONTEXT: the twist relaxes and the strands draw
       inward. TONE: they are gathered into the one thread — not torn apart.
       Phase is the integral of a linearly falling frequency, so the coil
       slows smoothly instead of folding (no wy*freq(wy) chirp). — */
  float helixW = smoothstep(-0.2, 0.25, wy) * (1.0 - smoothstep(2.3, 2.95, wy));
  if(helixW > 0.001){
    float u = clamp(wy - 0.6, 0.0, 1.6);
    float ph = 4.6 * wy - 2.4 * (u * u / 3.2 + max(0.0, wy - 2.2)) + uTime * 0.10;
    float draw = smoothstep(1.3, 2.6, wy);                 /* strands draw inward */
    float amp = 0.14 * (1.0 - draw) * uAspect;
    float cx = 0.5 * uAspect;
    /* the mouse: pairs near it glow softly and the helix leans a little
       toward it — a quiet response, gone the moment the mouse leaves */
    vec2 ptrSp = vec2(uPtr.x * uAspect, uPtr.y + uP * 5.0);
    /* only when the mouse is actually ON the helix: work out where the two
       strands are at the mouse's height and how far the mouse is from the
       structure (zero anywhere between the strands, over the pairs) */
    float wyP = ptrSp.y;
    float uPp = clamp(wyP - 0.6, 0.0, 1.6);
    float phP = 4.6 * wyP - 2.4 * (uPp * uPp / 3.2 + max(0.0, wyP - 2.2)) + uTime * 0.10;
    float ampP = 0.14 * (1.0 - smoothstep(1.3, 2.6, wyP)) * uAspect;
    float spanP = abs(sin(phP)) * ampP;
    float offP = max(0.0, abs(ptrSp.x - cx) - spanP) * uRes.y;
    float onHelix = (1.0 - smoothstep(18.0, 60.0, offP))
      * smoothstep(-0.2, 0.25, wyP) * (1.0 - smoothstep(2.3, 2.95, wyP));
    float hov = uHover * onHelix;
    float nearY = exp(-pow((wy - ptrSp.y) / 0.16, 2.0)) * hov;
    cx += clamp(ptrSp.x - cx, -0.3, 0.3) * 0.07 * nearY;
    float near = exp(-dot((sp - ptrSp) * uRes.y, (sp - ptrSp) * uRes.y) / (110.0 * 110.0)) * hov;
    float sn = sin(ph);
    float x1 = cx + sn * amp;
    float x2 = cx - sn * amp;
    float d1 = abs(sp.x - x1) * uRes.y;
    float d2 = abs(sp.x - x2) * uRes.y;
    /* depth: the strand crossing behind dims, the front one carries the light */
    float front = 0.5 + 0.5 * cos(ph);
    vec3 iceC = mix(vec3(0.624, 0.706, 0.784), vec3(0.85, 0.72, 0.50), warm * 0.35);
    vec3 humC = mix(vec3(0.94, 0.75, 0.50), vec3(0.96, 0.82, 0.60), warm * 0.35);
    /* as they converge the strands quieten, so the join never flares */
    float strandA = mix(1.0, 0.22, smoothstep(1.5, 2.6, wy));
    float lift = 1.0 + 0.5 * near;
    col += iceC * (exp(-d1 * 0.05) * 0.14 + exp(-d1 * d1 * 0.5) * 0.5) * (0.4 + 0.6 * front) * strandA * helixW * lift;
    col += humC * (exp(-d2 * 0.05) * 0.14 + exp(-d2 * d2 * 0.5) * 0.5) * (1.0 - 0.6 * front) * strandA * helixW * lift;
    /* base pairs — evenly and densely spaced down the whole helix, so even
       where the coil relaxes it still reads as DNA. Each pair is two
       halves, ice from the machine strand and amber from the human strand,
       meeting with a hairline gap, with a soft bead where it joins each
       strand. They hold through BEDROCK and CONTEXT and let go as the
       strands are drawn into the thread. */
    float rungW = 1.0 - smoothstep(1.15, 2.05, wy);
    if(rungW > 0.003){
      const float PITCH = 0.062;                           /* screen heights between pairs */
      float rp = fract(wy / PITCH);
      float rD = min(rp, 1.0 - rp) * PITCH * uRes.y;
      float rung = exp(-rD * rD * 1.0);
      /* each pair breathes a little on its own, so the ladder never feels ruled */
      float idx = floor(wy / PITCH + 0.5);
      rung *= 0.6 + 0.4 * sin(idx * 2.399 + uTime * 0.35);
      float lo = min(x1, x2);
      float hi = max(x1, x2);
      float len = hi - lo;
      float s = clamp((sp.x - x1) / max(1e-4, x2 - x1), 0.0, 1.0);  /* 0 at ice, 1 at amber */
      float between = smoothstep(lo - 0.0015, lo + 0.003, sp.x) * (1.0 - smoothstep(hi - 0.003, hi + 0.0015, sp.x));
      float gap = smoothstep(0.015, 0.06, abs(s - 0.5));
      vec3 pairC = s < 0.5 ? iceC : humC;
      /* short pairs near a crossing are seen end-on: let them recede */
      float reach = smoothstep(0.0, 0.05, len);
      float glow = 1.0 + 3.2 * near;
      col += pairC * rung * between * gap * 0.1 * glow * reach * rungW * helixW;
      /* beads where each pair meets its strand */
      float b1 = exp(-(d1 * d1 + rD * rD) * 0.35);
      float b2 = exp(-(d2 * d2 + rD * rD) * 0.35);
      col += (iceC * b1 * (0.4 + 0.6 * front) + humC * b2 * (1.0 - 0.6 * front)) * 0.1 * glow * reach * rungW * helixW;
    }
  }

  /* TONE · NUANCE · TRUST: the world stays composed — no bands, lattices or
     rings. All drama is carried by the living point gathering light. */

  /* — SURFACE: open, luminous, human — */
  float w5 = bandW(wy, 5.0);
  if(w5 > 0.001){
    float sh = fbm(vec2(sp.x * 0.8 - uTime * 0.03, wy * 0.5));
    sh = smoothstep(0.45, 0.85, sh);
    col += vec3(1.0, 0.94, 0.82) * sh * 0.08 * w5;
    vec3 vr = voro(sp * 7.0 + vec2(0.0, uTime * 0.11), 0.0);
    float tw = 0.5 + 0.5 * sin(uTime * 1.4 + vr.z * 31.0);
    float dust = 1.0 - smoothstep(0.0, 0.035, vr.x);
    col += vec3(0.72, 0.58, 0.38) * dust * (0.03 + 0.07 * tw) * w5;
  }

  /* ———————————————— the thread ———————————————— */
  float ampUv = 0.011 * (1.0 - 0.55 * uP) + 0.002;
  float sway = -uTime * 0.45 + uMouse.x * 0.9;
  float tx = 0.5 + sin(uv.y * 8.0 + sway) * ampUv;
  float dpix = abs(uv.x - tx) * uRes.x;
  vec3 tcol = threadColor(uP);
  float dim = 0.55 + 0.45 * smoothstep(0.0, 0.015, uP);
  float fil = 0.85 + 0.15 * sin(uv.y * 90.0 + uTime * 1.1);

  col += tcol * exp(-dpix * 0.012) * 0.055 * dim;                    /* volumetric haze */
  col += tcol * exp(-dpix * 0.055) * 0.20 * dim;                     /* inner glow */
  col += mix(tcol, vec3(1.0), 0.55) * exp(-dpix * dpix * 0.55) * 0.85 * dim * fil; /* core */

  /* head — the living point. From NUANCE onward it gathers light, brighter
     and brighter, until it finally breaks the surface. */
  float headY = 0.68 - 0.38 * easeIO(uP);
  float hx = 0.5 + sin(headY * 8.0 + sway) * ampUv;
  float dh = length((uv - vec2(hx, headY)) * vec2(uAspect, 1.0));
  float gather = smoothstep(0.46, 0.88, uP);
  float gAmp = 1.0 + gather * 1.7;
  float gWide = 1.0 + gather * 1.6;
  col += tcol * exp(-dh * dh * 900.0 / gWide) * 0.5 * dim * gAmp;
  col += mix(tcol, vec3(1.0), 0.6) * exp(-dh * dh * 16000.0 / gWide) * 1.2 * dim * gAmp;
  /* the gathering halo — first sign of the coming bloom */
  col += mix(tcol, vec3(1.0, 0.97, 0.9), 0.35) * exp(-dh * (3.2 - 2.0 * gather)) * 0.10 * gather;
  /* the living point radiates warmth into its surroundings, growing with p */
  col += vec3(0.94, 0.77, 0.55) * exp(-dh * 1.6) * 0.05 * warm;

  /* cursor light — the world notices you */
  vec2 muv = vec2(uMouse.x * 0.5 + 0.5, uMouse.y * 0.5 + 0.5);
  float dm = length((uv - muv) * vec2(uAspect, 1.0));
  col += tcol * exp(-dm * 3.2) * 0.018;

  /* — TRUST: the correction lands as one soft breath of light at the head,
       no rings, no shockwave — */
  float pulse = exp(-pow((uP - 0.745) / 0.018, 2.0));
  col += vec3(0.941, 0.745, 0.510) * exp(-dh * dh * 70.0) * 0.22 * pulse;

  /* — REVEAL: soft rings of light breathe out of the point while "Evolve."
       holds. Gaussian rings that widen and fade with distance — no edges. — */
  /* uRipT is the clock since the reveal began (-1 before it), so the rings
     are born one at a time from the point: one pulse, then the next, and
     only after a few seconds are several in flight together. Each birth is
     marked by the point itself brightening. */
  float ripA = 1.0 - smoothstep(0.93, 0.96, uP);
  if(uRipT >= 0.0 && ripA > 0.001){
    vec3 ripC = vec3(1.0, 0.90, 0.74);
    const float EVERY = 1.15;   /* seconds between pulses */
    const float LIFE = 4.6;     /* seconds a ring travels */
    float newest = floor(uRipT / EVERY);
    for(int k = 0; k < 4; k++){
      float n = newest - float(k);
      if(n < 0.0) break;
      float age = uRipT - n * EVERY;
      float ph = age / LIFE;
      if(ph >= 1.0) continue;
      float r = ph * 1.25;
      float w = 0.010 + 0.05 * ph;
      float ring = exp(-pow((dh - r) / w, 2.0));
      /* fade in over the first moment so the ring leaves the point softly */
      float born = smoothstep(0.0, 0.06, ph);
      col += ripC * ring * pow(1.0 - ph, 2.2) * born * 0.30 * ripA;
      /* the point swells as it sends each pulse out */
      col += ripC * exp(-dh * dh * 1400.0) * exp(-age * 2.6) * 0.55 * ripA;
    }
  }

  /* — the light swells: SURFACE bloom, now arriving after the reveal — */
  float bloom = clamp((uP - 0.905) / 0.06, 0.0, 1.0);
  if(bloom > 0.001){
    float e = 1.0 - pow(1.0 - bloom, 3.0);
    col += vec3(0.965, 0.918, 0.847) * exp(-dh * (6.0 - 5.2 * e)) * 0.85 * bloom;
    col += vec3(1.0, 0.96, 0.88) * exp(-dh * 1.2) * 0.30 * bloom;
  }

  /* — FLOOD: the light opens out from the point and fills the frame — */
  float flood = smoothstep(0.925, 0.968, uP);
  if(flood > 0.001){
    float fr = flood * 2.2;
    float fill = 1.0 - smoothstep(fr - 0.5, fr + 0.05, dh);
    col = mix(col, vec3(1.0, 0.965, 0.905), fill * flood);
  }

  /* — SETTLE: the light draws back into the point and the dark returns from
       the edges, so the page arrives at ink without passing through grey — */
  float settle = smoothstep(0.968, 0.998, uP);
  if(settle > 0.001){
    float sr = 2.2 * pow(1.0 - settle, 1.6);
    float keep = 1.0 - smoothstep(sr * 0.25, sr + 0.08, dh);
    vec3 ink = vec3(0.020, 0.027, 0.043);
    col = mix(ink, col, mix(1.0, keep, settle));
  }

  /* dither below one 8-bit step, so dark gradients never contour into lines */
  col += (h2(gl_FragCoord.xy + fract(uTime * 7.0) * 61.0) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
`;

const WORLD_VERT = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/* ————————————————————————— particle field ————————————————————————— */

const POINTS_VERT = /* glsl */ `
attribute vec4 aSeed;
attribute float aBand;
uniform float uP;
uniform float uTime;
uniform float uResY;
uniform float uPr;
varying vec3 vC;
varying float vA;

vec3 bandColor(float b){
  if(b < 0.5) return vec3(0.624, 0.706, 0.784);
  if(b < 1.5) return vec3(0.80, 0.87, 0.93);
  if(b < 2.5) return vec3(0.878, 0.604, 0.373);
  if(b < 3.5) return vec3(0.86, 0.68, 0.56);
  if(b < 4.5) return vec3(0.949, 0.812, 0.627);
  return vec3(0.85, 0.72, 0.5);
}

void main(){
  float camY = uP * 5.0 + 0.5;
  float relY = aSeed.y - camY;
  float band = aBand;
  float drift = uTime * (0.012 + 0.032 * fract(aSeed.w * 7.31)) * (band > 4.5 ? 2.4 : (band > 1.5 && band < 2.5 ? 0.4 : 1.0));
  float yy = aSeed.y + drift;
  /* wrap drift within the band */
  yy = band + fract(yy - band);
  relY = yy - camY;
  /* fade at band wrap boundaries so particles never pop along a line */
  float edgeF = smoothstep(0.0, 0.12, yy - band) * (1.0 - smoothstep(0.88, 1.0, yy - band));

  vec3 pos = vec3((aSeed.x - 0.5) * 3.4, relY * 1.35, -1.2 - aSeed.z * 5.0);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  float size = (0.5 + aSeed.w * 1.6) * (band > 4.5 ? 2.0 : 1.0);
  gl_PointSize = clamp(size * uPr * uResY * 0.0022 / max(0.8, -mv.z), 1.0, 5.0 * uPr);

  float tw = 0.55 + 0.45 * sin(uTime * (0.28 + 0.5 * aSeed.w) + aSeed.w * 40.0);
  float fog = exp(-abs(relY) * 1.15);
  float zfog = exp(-max(0.0, aSeed.z * 5.0) * 0.16);
  vA = tw * fog * zfog * edgeF * 0.6;
  float warm = smoothstep(0.05, 0.85, uP);
  vC = mix(bandColor(band), vec3(0.94, 0.79, 0.57), warm * 0.35);
  /* a few warm sparks travel with you from the very beginning */
  float spark = step(0.86, aSeed.w);
  vC = mix(vC, vec3(0.95, 0.80, 0.58), spark * (0.25 + 0.5 * warm));
}
`;

const POINTS_FRAG = /* glsl */ `
precision mediump float;
varying vec3 vC;
varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vA;
  if(a < 0.004) discard;
  gl_FragColor = vec4(vC, a);
}
`;

/* ————————————————————————— factory ————————————————————————— */

export function createWorld(canvas: HTMLCanvasElement, reduced: boolean): World | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    });
  } catch {
    return null;
  }
  if (!renderer.getContext()) return null;

  const isMobile = window.innerWidth < 760;
  const PR_TIERS = isMobile ? [1.25, 1.0, 0.85] : [1.5, 1.2, 1.0, 0.85];
  let tier = 0;

  /* world quad */
  const quadScene = new THREE.Scene();
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const worldUniforms = {
    uP: { value: 0 },
    uTime: { value: 0 },
    uRipT: { value: -1 },
    uPtr: { value: new THREE.Vector2(0.5, 0.5) },
    uHover: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uAspect: { value: 1 },
  };
  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      vertexShader: WORLD_VERT,
      fragmentShader: WORLD_FRAG,
      uniforms: worldUniforms,
      depthTest: false,
      depthWrite: false,
    }),
  );
  quad.frustumCulled = false;
  quadScene.add(quad);

  /* particle field */
  const ptScene = new THREE.Scene();
  const ptCam = new THREE.PerspectiveCamera(55, 1, 0.1, 20);
  const COUNT = isMobile ? 420 : 900;
  const seeds = new Float32Array(COUNT * 4);
  const bands = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const band = i % 6;
    seeds[i * 4] = Math.random();
    seeds[i * 4 + 1] = band + Math.random();
    seeds[i * 4 + 2] = Math.random();
    seeds[i * 4 + 3] = Math.random();
    bands[i] = band;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  geo.setAttribute('aBand', new THREE.BufferAttribute(bands, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -3), 20);
  const ptUniforms = {
    uP: { value: 0 },
    uTime: { value: 0 },
    uResY: { value: 900 },
    uPr: { value: 1 },
  };
  const points = new THREE.Points(
    geo,
    new THREE.ShaderMaterial({
      vertexShader: POINTS_VERT,
      fragmentShader: POINTS_FRAG,
      uniforms: ptUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    }),
  );
  points.frustumCulled = false;
  ptScene.add(points);

  const DRAW_TIERS = [COUNT, Math.floor(COUNT * 0.66), Math.floor(COUNT * 0.45), Math.floor(COUNT * 0.3)];

  let mx = 0;
  let my = 0;
  let smx = 0;
  let ripStart = -1;
  let px = 0.5;
  let py = 0.5;
  let spx = 0.5;
  let spy = 0.5;
  let hoverOn = 0;
  let hover = 0;
  let smy = 0;

  /* adaptive quality — hold 60fps by shedding resolution, then particles */
  let ema = 16.7;
  let frames = 0;
  let lastT = performance.now();

  function applyTier() {
    /* pixel budget: big or high-density screens start at a resolution the
       GPU can hold at full frame rate, instead of stuttering for the first
       seconds while the adaptive tiers catch up. The world is all soft
       light, so the difference in sharpness is invisible. */
    const r = canvas.getBoundingClientRect();
    const css = Math.max(1, r.width * r.height);
    const budget = isMobile ? 1.4e6 : 4.2e6;
    const pr = Math.max(
      0.75,
      Math.min(window.devicePixelRatio || 1, PR_TIERS[Math.min(tier, PR_TIERS.length - 1)], Math.sqrt(budget / css)),
    );
    renderer.setPixelRatio(pr);
    ptUniforms.uPr.value = pr;
    const n = DRAW_TIERS[Math.min(tier, DRAW_TIERS.length - 1)];
    geo.setDrawRange(0, n);
    resize();
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    worldUniforms.uRes.value.set(size.x, size.y);
    worldUniforms.uAspect.value = size.x / Math.max(1, size.y);
    ptCam.aspect = size.x / Math.max(1, size.y);
    ptCam.updateProjectionMatrix();
    ptUniforms.uResY.value = size.y;
  }
  applyTier();

  function paint(p: number, tRaw: number) {
    const t = reduced ? 0 : tRaw;

    /* adaptive quality bookkeeping */
    const now = performance.now();
    const dt = now - lastT;
    lastT = now;
    if (dt < 250) {
      ema = ema * 0.92 + dt * 0.08;
      frames++;
      if (frames % 100 === 0) {
        if (ema > 19 && tier < PR_TIERS.length - 1) {
          tier++;
          applyTier();
        } else if (ema < 12 && tier > 0) {
          tier--;
          applyTier();
        }
      }
    }

    smx += (mx - smx) * 0.06;
    smy += (my - smy) * 0.06;

    worldUniforms.uP.value = p;
    worldUniforms.uTime.value = t;
    /* reveal ripple clock: starts when the reveal is reached, resets if the
       visitor scrolls back above it */
    if (p >= 0.82 && ripStart < 0) ripStart = t;
    else if (p < 0.80) ripStart = -1;
    worldUniforms.uRipT.value = ripStart < 0 ? -1 : t - ripStart;
    worldUniforms.uMouse.value.set(smx, smy);
    spx += (px - spx) * 0.22;
    spy += (py - spy) * 0.22;
    hover += (hoverOn - hover) * 0.08;
    worldUniforms.uPtr.value.set(spx, spy);
    worldUniforms.uHover.value = hover;
    ptUniforms.uP.value = p;
    ptUniforms.uTime.value = t;
    /* forward travel: the camera dollies into the field and the lens
       compresses slightly as the ascent progresses */
    const eIO = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    ptCam.position.x = smx * 0.14;
    ptCam.position.y = smy * 0.09;
    ptCam.position.z = 0.9 * eIO;
    ptCam.fov = 55 - 7 * eIO;
    ptCam.updateProjectionMatrix();

    renderer.autoClear = true;
    renderer.render(quadScene, quadCam);
    renderer.autoClear = false;
    renderer.render(ptScene, ptCam);
    renderer.autoClear = true;
  }

  return {
    paint,
    resize: applyTier,
    setMouse: (x, y) => {
      mx = clamp(x, -1, 1);
      my = clamp(y, -1, 1);
    },
    setPointer: (x, y) => {
      if (x === null) {
        hoverOn = 0;
        return;
      }
      if (hover < 0.01) {
        spx = x;
        spy = y ?? 0.5;
      }
      px = x;
      py = y ?? 0.5;
      hoverOn = 1;
    },
    dispose: () => {
      geo.dispose();
      (points.material as THREE.Material).dispose();
      (quad.material as THREE.Material).dispose();
      quad.geometry.dispose();
      renderer.dispose();
    },
  };
}
