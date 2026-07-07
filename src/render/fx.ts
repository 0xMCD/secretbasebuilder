/**
 * Ambient animation: procedural sprites stay cached stills, but painters mark
 * regions that should MOVE (screen flicker, water shimmer, lava bubbles,
 * pulsing glows…) by emitting FxHints while they paint. Hints are cached with
 * the sprite and replayed by the renderer every frame — cheap fillRects on
 * top of the still, no re-painting.
 *
 * Emitting side (procedural painters): beginFx() / fx(ctx, hint) / endFx().
 * fx() maps the hint through the ctx's CURRENT transform, so scaled painters
 * (decor props, see moduleSprite.ts) emit correctly-placed hints for free.
 *
 * Drawing side (renderer): drawFx(ctx, hints, ox, oy, t, seed) — seed comes
 * from the placement id so two copies of the same room never animate in sync.
 */

export type FxKind = 'glow' | 'blink' | 'flicker' | 'shimmer' | 'bubble' | 'swim' | 'sparkle';

export interface FxHint {
  kind: FxKind;
  /** Sprite-local art px (post-transform). */
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  /** Extra colors cycled by swim/sparkle. */
  colors?: string[];
  /** Count override (fish, bubbles, sparkle points). */
  n?: number;
  /** Speed multiplier (1 = default pace). */
  speed?: number;
  /** Base alpha for glow (defaults to 0.14). */
  a?: number;
}

// --- collection (sprite generation time) ---

let sink: FxHint[] | null = null;

export function beginFx(): void {
  sink = [];
}

export function endFx(): FxHint[] {
  const out = sink ?? [];
  sink = null;
  return out;
}

/** Emit a hint in the painter's current coordinate space. */
export function fx(ctx: CanvasRenderingContext2D, hint: FxHint): void {
  if (!sink) return;
  const m = ctx.getTransform();
  // Painters only translate/scale, so an axis-aligned map is exact.
  sink.push({
    ...hint,
    x: m.a * hint.x + m.e,
    y: m.d * hint.y + m.f,
    w: m.a * hint.w,
    h: m.d * hint.h,
  });
}

// --- replay (render time) ---

/** Deterministic per-placement seed so copies animate out of phase. */
export function fxSeed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable pseudo-random in [0,1) from two ints. */
function h01(a: number, b: number): number {
  let h = Math.imul(a ^ 0x9e3779b9, 374761393) ^ Math.imul(b ^ 0x85ebca6b, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const fract = (n: number): number => n - Math.floor(n);

export function drawFx(
  c: CanvasRenderingContext2D,
  hints: FxHint[],
  ox: number,
  oy: number,
  t: number,
  seed: number,
): void {
  const phase = (seed % 6283) / 1000; // 0..2π-ish
  for (let hi = 0; hi < hints.length; hi++) {
    const h = hints[hi];
    const x = ox + h.x;
    const y = oy + h.y;
    const sp = h.speed ?? 1;
    const hs = (seed + hi * 131) | 0;
    switch (h.kind) {
      case 'glow': {
        // gentle breathe on top of the painted halo
        const base = h.a ?? 0.14;
        c.globalAlpha = base * 0.5 * (1 + Math.sin(t * 1.7 * sp + phase + hi * 1.3));
        c.fillStyle = h.color;
        c.fillRect(x, y, h.w, h.h);
        break;
      }
      case 'blink': {
        if (fract(t * 0.9 * sp + h01(hs, 1)) < 0.55) {
          c.globalAlpha = 0.9;
          c.fillStyle = h.color;
          c.fillRect(x, y, h.w, h.h);
        }
        break;
      }
      case 'flicker': {
        // rolling scanline + occasional full-screen blip
        c.fillStyle = '#ffffff';
        c.globalAlpha = 0.09;
        const band = fract(t * 0.35 * sp + h01(hs, 2));
        c.fillRect(x, y + band * Math.max(1, h.h - 6), h.w, 6);
        if (h01(Math.floor(t * 2.5 * sp) + hi, hs) < 0.15) {
          c.globalAlpha = 0.06;
          c.fillRect(x, y, h.w, h.h);
        }
        break;
      }
      case 'shimmer': {
        // highlight bands drifting across water
        c.fillStyle = h.color;
        const n = h.n ?? Math.max(2, Math.round(h.w / 90));
        for (let i = 0; i < n; i++) {
          const p = fract(t * 0.1 * sp * (1 + h01(i, hs) * 0.7) + i / n + phase / 7);
          const bw = Math.max(8, h.w / 9);
          c.globalAlpha = 0.18 + 0.1 * Math.sin(t * 2 + i * 2.1 + phase);
          c.fillRect(x + p * Math.max(1, h.w - bw), y + h01(i, hs + 7) * Math.max(1, h.h - 3), bw, 3);
        }
        break;
      }
      case 'bubble': {
        // dots rising through the region, fading out near the top
        c.fillStyle = h.color;
        const n = h.n ?? Math.max(3, Math.round(h.w / 70));
        for (let i = 0; i < n; i++) {
          const p = fract(t * 0.22 * sp * (0.7 + h01(i, hs) * 0.6) + h01(i, hs + 3));
          const s = 3 + Math.round(h01(i, hs + 5) * 3);
          c.globalAlpha = 0.85 * (1 - p);
          c.fillRect(x + h01(i, hs + 9) * Math.max(1, h.w - s), y + (1 - p) * Math.max(1, h.h - s), s, s);
        }
        break;
      }
      case 'swim': {
        // little fish criss-crossing the region
        const cols = h.colors?.length ? h.colors : [h.color];
        const n = h.n ?? 3;
        for (let i = 0; i < n; i++) {
          const dir = i % 2 === 0 ? 1 : -1;
          const p = fract(t * 0.05 * sp * (0.8 + h01(i, hs) * 0.7) + h01(i, hs + 11));
          const fxp = x + (dir === 1 ? p : 1 - p) * Math.max(1, h.w - 16);
          const fyp = y + (0.15 + 0.7 * h01(i, hs + 13)) * Math.max(1, h.h - 8) + Math.sin(t * 1.4 + i * 2) * 3;
          c.globalAlpha = 0.95;
          c.fillStyle = cols[i % cols.length];
          c.fillRect(fxp, fyp, 11, 6);
          c.fillRect(fxp + (dir === 1 ? -4 : 11), fyp + 1, 4, 4); // tail
          c.fillStyle = '#14181d';
          c.fillRect(fxp + (dir === 1 ? 8 : 1), fyp + 2, 2, 2); // eye
        }
        break;
      }
      case 'sparkle': {
        // twinkling points at stable positions inside the region
        const cols = h.colors?.length ? h.colors : [h.color];
        const n = h.n ?? 6;
        for (let i = 0; i < n; i++) {
          const tw = Math.abs(Math.sin(t * (1.2 + h01(i, hs)) * sp + i * 2.4 + phase));
          if (tw < 0.35) continue;
          c.globalAlpha = tw * 0.85;
          c.fillStyle = cols[i % cols.length];
          c.fillRect(
            x + h01(i, hs + 17) * Math.max(1, h.w - 3),
            y + h01(i * 3 + 1, hs + 19) * Math.max(1, h.h - 3),
            3,
            3,
          );
        }
        break;
      }
    }
  }
  c.globalAlpha = 1;
}
