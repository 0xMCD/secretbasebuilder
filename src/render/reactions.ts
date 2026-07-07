/**
 * Interactive props: tapping certain rooms plays a one-shot reaction — the
 * base pokes back. Pure world-space overlay animation, no state, no save
 * impact; a reaction just runs to completion and disappears.
 *
 *   silo        → rocket test-fire: countdown strobes, engine flame, steam
 *   discoball   → dance party: orbiting colored spots + every resident dances
 *   aquarium    → feeding time: flakes rain down, fish dart up
 *   trampoline  → bounce show: balls fly, stars pop
 */
import { ART_CELL, placementRect } from '../core/grid';
import { getDef } from '../core/catalog';
import type { Placement } from '../core/types';
import { startParty } from './agents';

interface Reaction {
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
  start: number;
}

const DURATIONS: Record<string, number> = {
  silo: 6000,
  discoball: 8000,
  aquarium: 5000,
  trampoline: 4000,
};

const active = new Map<string, Reaction>();
// Dev probe (?perf): inspect running reactions from the console/driver.
if (typeof location !== 'undefined' && location.search.includes('perf')) {
  (window as unknown as { __reactions: Map<string, Reaction> }).__reactions = active;
}

/** True if the tap started a reaction (used to give feedback, not to swallow selection). */
export function triggerReaction(p: Placement | undefined): boolean {
  if (!p) return false;
  const def = getDef(p.defId);
  if (!def || !(def.kind in DURATIONS) || active.has(p.id)) return false;
  const rect = placementRect(p);
  if (!rect) return false;
  active.set(p.id, {
    kind: def.kind,
    x: rect.x * ART_CELL,
    y: rect.y * ART_CELL,
    w: rect.w * ART_CELL,
    h: rect.h * ART_CELL,
    start: performance.now(),
  });
  if (def.kind === 'discoball') startParty(DURATIONS.discoball / 1000);
  return true;
}

const h01 = (a: number, b: number): number => {
  let h = Math.imul(a ^ 0x9e3779b9, 374761393) ^ Math.imul(b ^ 0x85ebca6b, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const fract = (n: number): number => n - Math.floor(n);

/** Draw all running reactions (world space). Call after agents so steam and
 * confetti fall in front of everyone. */
export function drawReactions(c: CanvasRenderingContext2D): void {
  const now = performance.now();
  const t = now / 1000;
  for (const [id, r] of active) {
    const e = (now - r.start) / DURATIONS[r.kind]; // 0..1 across the reaction
    if (e >= 1) {
      active.delete(id);
      continue;
    }
    switch (r.kind) {
      case 'silo': {
        // countdown strobes, then main-engine test fire with steam
        if (e < 0.4) {
          c.globalAlpha = 0.16 * Math.abs(Math.sin(t * 10));
          c.fillStyle = '#ff5555';
          c.fillRect(r.x, r.y, r.w, r.h);
          for (let i = 0; i < 3; i++) { // 3…2…1 lamps
            c.globalAlpha = e * 2.5 > (i + 1) / 3 ? 0.95 : 0.2;
            c.fillStyle = '#ffd166';
            c.fillRect(r.x + 28 + i * 42, r.y + 26, 30, 30);
          }
        } else {
          const fx0 = r.x + r.w * 0.44; // engine bell (matches the painter)
          const fy = r.y + r.h - 52;
          const roar = (e - 0.4) / 0.6;
          const jit = Math.sin(t * 40) * 6;
          for (let i = 0; i < 5; i++) { // flame tongues, big and loud
            const fw = 24 + i * 18;
            const fh = (60 + i * 26) * (0.6 + 0.4 * Math.abs(Math.sin(t * 18 + i)));
            c.globalAlpha = 0.9 - i * 0.14;
            c.fillStyle = i < 2 ? '#fff3c2' : i < 4 ? '#ffd166' : '#ff7b2e';
            c.fillRect(fx0 - fw / 2 + jit * (i % 2 ? 1 : -1) * 0.3, fy - 6, fw, fh * Math.min(1, roar * 3));
          }
          for (let i = 0; i < 14; i++) { // steam billowing out both sides
            const side = i % 2 ? 1 : -1;
            const p2 = fract(roar * 1.4 + h01(i, 7));
            const sx = fx0 + side * (26 + p2 * (r.w * 0.5));
            const sy = fy + 26 - p2 * 90;
            const s = 22 + p2 * 44;
            c.globalAlpha = 0.5 * (1 - p2);
            c.fillStyle = '#e8edf2';
            c.fillRect(sx - s / 2, sy - s / 2, s, s);
          }
          if (e > 0.85) { // TEST OK confetti
            for (let i = 0; i < 24; i++) {
              const p2 = fract((e - 0.85) * 4 + h01(i, 3));
              c.globalAlpha = 1 - p2;
              c.fillStyle = ['#ffd166', '#38e1ff', '#ff8fdc', '#7fc95c'][i % 4];
              c.fillRect(r.x + h01(i, 11) * r.w, r.y + 30 + p2 * (r.h * 0.5), 7, 7);
            }
          }
        }
        break;
      }
      case 'discoball': {
        const cx = r.x + r.w / 2;
        const cy = r.y + r.h * 0.52;
        const colors = ['#ff8fdc', '#38e1ff', '#ffd166', '#7fc95c'];
        for (let i = 0; i < 4; i++) { // orbiting party spots (stay in the room)
          const ang = t * 2.2 + (i * Math.PI) / 2;
          const sx = cx + Math.cos(ang) * r.w * 1.1;
          const sy = cy + Math.sin(ang) * r.h * 0.34;
          c.globalAlpha = 0.4;
          c.fillStyle = colors[i];
          c.fillRect(sx - 14, sy - 14, 28, 28);
          c.globalAlpha = 0.18;
          c.fillRect(sx - 26, sy - 26, 52, 52);
        }
        c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 8); // ball flash
        c.fillStyle = '#ffffff';
        c.fillRect(cx - 6, cy - 6, 12, 12);
        break;
      }
      case 'aquarium': {
        for (let i = 0; i < 14; i++) { // food flakes sway down
          const p2 = fract(e * 2 + h01(i, 5));
          const fx0 = r.x + 30 + h01(i, 9) * (r.w - 60) + Math.sin(t * 3 + i) * 6;
          c.globalAlpha = 0.9 * (1 - p2 * 0.4);
          c.fillStyle = i % 3 ? '#ffd166' : '#e8c46f';
          c.fillRect(fx0, r.y + 30 + p2 * r.h * 0.5, 4, 4);
        }
        for (let i = 0; i < 5; i++) { // fish dart up toward the food
          const p2 = fract(e * 1.6 + h01(i, 13));
          const fx0 = r.x + 40 + h01(i, 17) * (r.w - 90) + Math.sin(t * 6 + i * 2) * 10;
          const fy = r.y + r.h * 0.75 - p2 * r.h * 0.4;
          c.globalAlpha = 0.95;
          c.fillStyle = ['#ffd166', '#ff8fdc', '#38e1ff', '#ff9d4d'][i % 4];
          c.fillRect(fx0, fy, 12, 7);
          c.fillRect(fx0 - 4, fy + 1, 4, 5);
        }
        break;
      }
      case 'trampoline': {
        for (let i = 0; i < 3; i++) { // balls flying
          const bx = r.x + r.w * (0.25 + i * 0.25);
          const bh = Math.abs(Math.sin(t * 3.4 + i * 1.3));
          const by = r.y + r.h - 60 - bh * (r.h * 0.55);
          c.globalAlpha = 1;
          c.fillStyle = ['#e86a5a', '#38e1ff', '#ffd166'][i];
          c.fillRect(bx - 8, by - 8, 16, 16);
          if (bh > 0.93) { // star pop at the apex
            c.fillStyle = '#ffffff';
            c.fillRect(bx - 2, by - 22, 4, 12);
            c.fillRect(bx - 10, by - 14, 20, 4);
          }
        }
        break;
      }
    }
  }
  c.globalAlpha = 1;
}
