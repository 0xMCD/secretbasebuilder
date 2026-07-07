/**
 * Shared drawing kit for procedural room painters (256 art px per grid cell).
 *
 * THEMES ARE CONSTRUCTION, NOT TINT: key props (beds, couches, lamps) switch
 * on the theme id and draw genuinely different objects — a tech bedroom gets
 * a sleep pod, a fantasy one a four-poster. themeFlavor() additionally stamps
 * 1-2 signature wall props into every room (cable trays / torches / pipes /
 * string lights / chandeliers) so the theme reads even before furniture.
 *
 * COLOR POLICY: construction + generic furniture always come from the theme
 * palette (pal.*). Fixed hex "hero colors" are DELIBERATE and identical in
 * every theme — things whose real-world color is their identity: race-car
 * red, water blues, turf green, bone white, gold treasure, safety orange,
 * crowd-shirt candy colors. Don't palette-ify those; don't hardcode anything
 * else.
 */
import type { ModuleDef, ThemePalette } from '../../core/types';
import { fx } from '../fx';
import type { Rng } from './rng';

export type Ctx = CanvasRenderingContext2D;

export interface Interior {
  x: number;
  y: number;
  w: number;
  h: number;
  /** y of the floor line props stand on (= y + h). */
  floor: number;
}

export type Painter = (
  ctx: Ctx,
  room: Interior,
  pal: ThemePalette,
  rng: Rng,
  def: ModuleDef,
  theme: string,
) => void;

// --- primitives ---

export const r = (ctx: Ctx, color: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

/** Translucent dark shade (depth). */
export const sh = (ctx: Ctx, x: number, y: number, w: number, h: number, a = 0.18) => {
  ctx.globalAlpha = a;
  ctx.fillStyle = '#000000';
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  ctx.globalAlpha = 1;
};

/** Translucent light highlight. */
export const hl = (ctx: Ctx, x: number, y: number, w: number, h: number, a = 0.14) => {
  ctx.globalAlpha = a;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  ctx.globalAlpha = 1;
};

/** Soft ground shadow under a piece of furniture. */
export const shadow = (ctx: Ctx, x: number, floor: number, w: number) =>
  sh(ctx, x, floor - 4, w, 4, 0.25);

/** Glow halo around a light source. Every halo breathes at runtime: it also
 * emits a matching 'glow' fx hint, which is what makes lamps, torches, neon
 * and lava feel alive without any per-painter work. */
export const halo = (ctx: Ctx, color: string, x: number, y: number, w: number, h: number, a = 0.16) => {
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  ctx.globalAlpha = 1;
  fx(ctx, { kind: 'glow', x, y, w, h, color, a: a * 0.8 });
};

/** Blocky circle (stepped rects) — the pixel-art way to draw round things. */
export function disc(ctx: Ctx, color: string, cx: number, cy: number, rad: number) {
  ctx.fillStyle = color;
  for (let dy = -rad; dy <= rad; dy += 2) {
    const half = Math.round(Math.sqrt(Math.max(0, rad * rad - dy * dy)));
    ctx.fillRect(Math.round(cx - half), Math.round(cy + dy), half * 2, 2);
  }
}

/** Blocky circle outline. */
export function ring(ctx: Ctx, color: string, cx: number, cy: number, rad: number, t = 3) {
  ctx.fillStyle = color;
  const steps = Math.max(12, Math.round(rad / 2));
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    ctx.fillRect(Math.round(cx + Math.cos(a) * rad), Math.round(cy + Math.sin(a) * rad), t, t);
  }
}

// --- theme-variant furniture ---

/** Ceiling light: LED bar / lantern / caged bulb / fabric pendant / chandelier. */
export function ceilingLamp(ctx: Ctx, pal: ThemePalette, theme: string, cx: number, y: number) {
  switch (theme) {
    case 'tech':
      r(ctx, pal.furnitureDark, cx - 30, y + 4, 60, 8);
      r(ctx, pal.glow, cx - 26, y + 12, 52, 4);
      halo(ctx, pal.glow, cx - 34, y + 12, 68, 26);
      break;
    case 'fantasy':
      r(ctx, pal.trim, cx - 2, y, 4, 22); // chain
      r(ctx, pal.furnitureDark, cx - 14, y + 22, 28, 20); // lantern body
      r(ctx, pal.glow, cx - 8, y + 27, 16, 11); // flame window
      r(ctx, pal.furnitureDark, cx - 8, y + 42, 16, 4);
      halo(ctx, pal.glow, cx - 22, y + 22, 44, 30);
      break;
    case 'realistic':
      r(ctx, pal.trim, cx - 2, y, 4, 14);
      r(ctx, pal.glow, cx - 8, y + 14, 16, 16); // bulb
      r(ctx, pal.furnitureDark, cx - 10, y + 12, 20, 3); // cage top
      r(ctx, pal.furnitureDark, cx - 10, y + 14, 3, 18);
      r(ctx, pal.furnitureDark, cx + 7, y + 14, 3, 18);
      halo(ctx, pal.glow, cx - 18, y + 14, 36, 26);
      break;
    case 'glam': {
      r(ctx, '#f5c542', cx - 2, y, 4, 12);
      r(ctx, '#f5c542', cx - 28, y + 12, 56, 6); // gold arm
      for (let i = -2; i <= 2; i++) {
        r(ctx, pal.glow, cx + i * 12 - 2, y + 18, 4, 10); // crystals
        halo(ctx, pal.glow, cx + i * 12 - 5, y + 24, 10, 10, 0.25);
      }
      halo(ctx, '#ffe9f4', cx - 34, y + 14, 68, 26);
      break;
    }
    default: // cozy
      r(ctx, pal.trim, cx - 2, y, 4, 16);
      r(ctx, pal.accent, cx - 18, y + 16, 36, 16); // fabric shade
      r(ctx, pal.furnitureDark, cx - 18, y + 30, 36, 2);
      r(ctx, pal.glow, cx - 10, y + 32, 20, 5);
      halo(ctx, pal.glow, cx - 26, y + 30, 52, 26);
  }
}

/** Bed: sleep pod / four-poster / metal frame / quilted / round-glam. */
export function bed(ctx: Ctx, pal: ThemePalette, theme: string, x: number, floor: number, w: number) {
  shadow(ctx, x, floor, w);
  switch (theme) {
    case 'tech': {
      // sleep pod: rounded capsule with glow rim + status panel
      r(ctx, pal.furnitureDark, x + 6, floor - 52, w - 12, 44);
      r(ctx, pal.furnitureDark, x + 14, floor - 60, w - 28, 8);
      r(ctx, pal.furniture, x + 10, floor - 48, w - 20, 16); // hatch glass area
      r(ctx, pal.glow, x + 14, floor - 46, w - 40, 10); // sleeper glow
      r(ctx, pal.accent, x + 6, floor - 10, w - 12, 4); // glow rim
      halo(ctx, pal.accent, x + 2, floor - 10, w - 4, 10);
      r(ctx, pal.accent, x + w - 22, floor - 44, 10, 8); // status panel
      break;
    }
    case 'fantasy': {
      // four-poster with canopy
      r(ctx, pal.furnitureDark, x + 2, floor - 96, 8, 96); // posts
      r(ctx, pal.furnitureDark, x + w - 10, floor - 96, 8, 96);
      r(ctx, pal.accent, x, floor - 104, w, 10); // canopy
      ctx.globalAlpha = 0.35;
      r(ctx, pal.accent, x + 4, floor - 94, 10, 50); // drapes
      r(ctx, pal.accent, x + w - 14, floor - 94, 10, 50);
      ctx.globalAlpha = 1;
      r(ctx, pal.furniture, x + 10, floor - 40, w - 20, 28); // frame
      r(ctx, pal.glow, x + 14, floor - 52, 34, 14); // pillow
      r(ctx, pal.accent, x + 52, floor - 50, w - 66, 22); // blanket
      ctx.globalAlpha = 0.3;
      r(ctx, pal.glow, x + 58, floor - 46, w - 78, 3); // embroidery line
      ctx.globalAlpha = 1;
      break;
    }
    case 'glam': {
      // giant round headboard + satin + heart pillow
      disc(ctx, pal.accent, x + 24, floor - 62, 34);
      disc(ctx, pal.furniture, x + 24, floor - 62, 26);
      r(ctx, pal.furniture, x + 12, floor - 40, w - 24, 28);
      r(ctx, pal.glow, x + 16, floor - 48, w - 36, 12); // satin sheet
      hl(ctx, x + 16, floor - 48, w - 36, 4, 0.3);
      disc(ctx, '#ff8fdc', x + 34, floor - 54, 8); // heart pillow (two lobes)
      disc(ctx, '#ff8fdc', x + 46, floor - 54, 8);
      r(ctx, '#ff8fdc', x + 28, floor - 52, 30, 10);
      r(ctx, '#f5c542', x + 14, floor - 12, 6, 12); // gold feet
      r(ctx, '#f5c542', x + w - 22, floor - 12, 6, 12);
      break;
    }
    case 'realistic': {
      // sturdy metal frame cot
      r(ctx, pal.trim, x + 6, floor - 44, 6, 44);
      r(ctx, pal.trim, x + w - 12, floor - 44, 6, 44);
      r(ctx, pal.trim, x + 6, floor - 44, w - 12, 5);
      r(ctx, pal.furniture, x + 12, floor - 36, w - 24, 18);
      r(ctx, pal.glow, x + 16, floor - 44, 30, 10); // pillow
      r(ctx, '#5f7a52', x + 50, floor - 42, w - 66, 16); // army blanket
      ctx.globalAlpha = 0.3;
      r(ctx, pal.furnitureDark, x + 12, floor - 22, w - 24, 2);
      ctx.globalAlpha = 1;
      break;
    }
    default: {
      // cozy: quilted patchwork
      r(ctx, pal.furnitureDark, x, floor - 66, 12, 66); // headboard
      r(ctx, pal.furniture, x + 2, floor - 64, 8, 4);
      r(ctx, pal.furniture, x + 12, floor - 40, w - 24, 26);
      r(ctx, pal.glow, x + 16, floor - 52, 32, 13); // pillow
      hl(ctx, x + 16, floor - 52, 32, 4);
      // patchwork quilt
      const qx = x + 52;
      const qw = w - 68;
      for (let i = 0; i < Math.floor(qw / 16); i++) {
        r(ctx, i % 2 ? pal.accent : pal.glow, qx + i * 16, floor - 50, 16, 11);
        r(ctx, i % 2 ? pal.glow : pal.accent, qx + i * 16, floor - 39, 16, 11);
      }
      r(ctx, pal.furnitureDark, x + 16, floor - 12, 8, 12); // legs
      r(ctx, pal.furnitureDark, x + w - 22, floor - 12, 8, 12);
    }
  }
}

/** Couch: glow bench / carved wood+fur / plain sofa / overstuffed / chaise. */
export function couch(ctx: Ctx, pal: ThemePalette, theme: string, x: number, floor: number, w: number) {
  shadow(ctx, x, floor, w);
  switch (theme) {
    case 'tech': {
      r(ctx, pal.furniture, x, floor - 60, w, 14); // floating back
      r(ctx, pal.accent, x + 4, floor - 44, w - 8, 22); // seat
      ctx.globalAlpha = 0.3;
      r(ctx, pal.furnitureDark, x + w / 2 - 2, floor - 44, 4, 22);
      ctx.globalAlpha = 1;
      r(ctx, pal.furnitureDark, x + 4, floor - 22, w - 8, 12);
      r(ctx, pal.glow, x + 4, floor - 8, w - 8, 4); // underglow
      halo(ctx, pal.glow, x, floor - 8, w, 8);
      break;
    }
    case 'fantasy': {
      r(ctx, pal.furnitureDark, x, floor - 64, 14, 64); // carved arms
      r(ctx, pal.furnitureDark, x + w - 14, floor - 64, 14, 64);
      r(ctx, pal.trim, x + 2, floor - 64, 10, 6); // finials
      r(ctx, pal.trim, x + w - 12, floor - 64, 10, 6);
      r(ctx, pal.furniture, x + 8, floor - 72, w - 16, 24); // high back
      r(ctx, pal.accent, x + 14, floor - 48, w - 28, 26); // cushion
      hl(ctx, x + 14, floor - 30, w - 28, 12, 0.22); // fur throw
      hl(ctx, x + 18, floor - 26, w - 36, 4, 0.3);
      r(ctx, pal.furnitureDark, x + 14, floor - 20, w - 28, 14);
      break;
    }
    case 'glam': {
      // chaise lounge: one high scrolled end sweeping low
      disc(ctx, pal.accent, x + 18, floor - 58, 18);
      r(ctx, pal.accent, x + 14, floor - 58, w - 30, 30);
      r(ctx, pal.accent, x + 30, floor - 40, w - 44, 16);
      hl(ctx, x + 18, floor - 54, w - 40, 5, 0.25);
      disc(ctx, pal.glow, x + w - 34, floor - 40, 10); // toss pillow
      r(ctx, '#f5c542', x + 20, floor - 12, 6, 12); // gold legs
      r(ctx, '#f5c542', x + w - 26, floor - 12, 6, 12);
      break;
    }
    case 'realistic': {
      r(ctx, pal.furnitureDark, x, floor - 56, 12, 52);
      r(ctx, pal.furnitureDark, x + w - 12, floor - 56, 12, 52);
      r(ctx, pal.furniture, x + 6, floor - 66, w - 12, 22);
      r(ctx, pal.furniture, x + 12, floor - 44, w - 24, 24);
      ctx.globalAlpha = 0.25;
      r(ctx, pal.furnitureDark, x + 12, floor - 32, w - 24, 2);
      ctx.globalAlpha = 1;
      r(ctx, pal.furnitureDark, x + 12, floor - 20, w - 24, 14);
      break;
    }
    default: {
      // cozy: overstuffed with a draped blanket
      disc(ctx, pal.furniture, x + 12, floor - 52, 14);
      disc(ctx, pal.furniture, x + w - 12, floor - 52, 14);
      r(ctx, pal.furniture, x + 8, floor - 76, w - 16, 30); // puffy back
      hl(ctx, x + 12, floor - 72, w - 24, 6);
      r(ctx, pal.accent, x + 14, floor - 48, w - 28, 28); // cushions
      ctx.globalAlpha = 0.3;
      r(ctx, pal.furnitureDark, x + w / 2 - 2, floor - 48, 4, 28);
      ctx.globalAlpha = 1;
      r(ctx, pal.glow, x + 18, floor - 60, 24, 20); // throw pillow
      r(ctx, pal.glow, x + w - 44, floor - 34, 30, 22); // draped blanket
      r(ctx, pal.furnitureDark, x + 14, floor - 20, w - 28, 16);
    }
  }
}

export function table(ctx: Ctx, pal: ThemePalette, x: number, floor: number, w: number) {
  shadow(ctx, x, floor, w);
  r(ctx, pal.furniture, x, floor - 40, w, 10);
  hl(ctx, x, floor - 40, w, 3);
  ctx.globalAlpha = 0.3;
  r(ctx, pal.furnitureDark, x + 6, floor - 34, w - 12, 2);
  ctx.globalAlpha = 1;
  r(ctx, pal.furnitureDark, x + 6, floor - 30, 8, 30);
  r(ctx, pal.furnitureDark, x + w - 14, floor - 30, 8, 30);
}

export function crate(ctx: Ctx, pal: ThemePalette, x: number, y: number, s: number) {
  r(ctx, pal.furniture, x, y, s, s);
  hl(ctx, x, y, s, 4);
  ctx.globalAlpha = 0.4;
  r(ctx, pal.furnitureDark, x + 4, y + Math.floor(s / 3), s - 8, 4);
  r(ctx, pal.furnitureDark, x + 4, y + Math.floor((2 * s) / 3), s - 8, 4);
  ctx.globalAlpha = 1;
  r(ctx, pal.trim, x + Math.floor(s / 2) - 4, y + 2, 8, s - 4); // strap
  r(ctx, pal.accent, x + 6, y + 6, 10, 10); // stencil
}

export function barrel(ctx: Ctx, pal: ThemePalette, x: number, floor: number) {
  shadow(ctx, x, floor, 36);
  r(ctx, pal.furniture, x, floor - 52, 36, 52);
  hl(ctx, x + 4, floor - 52, 8, 52);
  r(ctx, pal.trim, x, floor - 44, 36, 6);
  r(ctx, pal.trim, x, floor - 18, 36, 6);
}

export function wallScreen(ctx: Ctx, pal: ThemePalette, x: number, y: number, w: number, h: number, rng: Rng) {
  r(ctx, pal.furnitureDark, x - 8, y - 8, w + 16, h + 16); // bezel
  hl(ctx, x - 8, y - 8, w + 16, 4);
  r(ctx, '#0d1117', x, y, w, h);
  const n = Math.max(2, Math.floor(w / 40));
  for (let i = 0; i < n; i++) {
    r(ctx, rng.chance(0.7) ? pal.accent : pal.glow, x + 8 + (i * (w - 16)) / n, y + rng.int(8, h - 24), rng.int(12, 24), rng.int(6, 12));
  }
  ctx.globalAlpha = 0.6;
  let ly = y + h - 16 - rng.int(0, 12);
  for (let lx = x + 6; lx < x + w - 12; lx += 12) {
    r(ctx, pal.glow, lx, ly, 12, 4);
    ly = Math.min(y + h - 8, Math.max(y + 8, ly + rng.int(-8, 8)));
  }
  ctx.globalAlpha = 1;
  r(ctx, pal.glow, x + w - 14, y + 8, 6, 6); // live dot
  ctx.globalAlpha = 0.08;
  for (let sy = y + 4; sy < y + h; sy += 8) r(ctx, '#ffffff', x, sy, w, 2);
  ctx.globalAlpha = 1;
  fx(ctx, { kind: 'flicker', x, y, w, h, color: '#ffffff' });
  fx(ctx, { kind: 'blink', x: x + w - 14, y: y + 8, w: 6, h: 6, color: pal.glow });
}

export function shelf(ctx: Ctx, pal: ThemePalette, x: number, y: number, w: number, rows: number, rng: Rng) {
  for (let i = 0; i < rows; i++) {
    const sy = y + i * 44;
    r(ctx, pal.furniture, x, sy + 34, w, 8);
    sh(ctx, x, sy + 42, w, 4);
    let bx = x + 6;
    while (bx < x + w - 18) {
      const bw = rng.int(10, 18);
      const bh = rng.int(22, 32);
      const c = rng.chance(0.4) ? pal.accent : rng.chance(0.5) ? pal.trim : pal.glow;
      r(ctx, c, bx, sy + 34 - bh, bw, bh);
      sh(ctx, bx + bw - 4, sy + 34 - bh, 4, bh, 0.25);
      if (rng.chance(0.15)) r(ctx, pal.glow, bx + 2, sy + 34 - bh - 4, bw - 4, 4); // tilted top book
      bx += bw + rng.int(2, 8);
    }
  }
}

export function rug(ctx: Ctx, pal: ThemePalette, x: number, floor: number, w: number) {
  r(ctx, pal.accent, x, floor - 8, w, 8);
  r(ctx, pal.trim, x + 10, floor - 6, w - 20, 2);
  for (let fx = x; fx < x + w; fx += 12) r(ctx, pal.trim, fx, floor - 2, 4, 2); // fringe
}

export function plant(ctx: Ctx, pal: ThemePalette, x: number, floor: number) {
  shadow(ctx, x, floor, 28);
  r(ctx, pal.furnitureDark, x + 2, floor - 20, 24, 20);
  r(ctx, pal.trim, x, floor - 24, 28, 6);
  r(ctx, pal.accent, x + 12, floor - 52, 6, 28);
  r(ctx, pal.accent, x + 2, floor - 44, 12, 10);
  r(ctx, pal.accent, x + 16, floor - 48, 12, 10);
  r(ctx, pal.glow, x + 10, floor - 60, 10, 10);
}

export function poster(ctx: Ctx, pal: ThemePalette, x: number, y: number, w: number, h: number) {
  r(ctx, pal.trim, x - 4, y - 4, w + 8, h + 8);
  r(ctx, pal.accent, x, y, w, h);
  sh(ctx, x, y + h - Math.floor(h / 3), w, Math.floor(h / 3), 0.3);
  r(ctx, pal.glow, x + Math.floor(w / 4), y + Math.floor(h / 4), Math.floor(w / 3), 6);
}

export function sconce(ctx: Ctx, pal: ThemePalette, theme: string, x: number, y: number) {
  if (theme === 'fantasy') {
    r(ctx, pal.trim, x + 2, y + 14, 12, 6); // bracket
    r(ctx, pal.furnitureDark, x + 5, y + 8, 6, 8); // torch handle
    r(ctx, '#ff9d4d', x + 3, y - 2, 10, 10); // flame
    r(ctx, '#ffd166', x + 5, y - 6, 6, 8);
    halo(ctx, '#ffd166', x - 8, y - 10, 32, 30);
  } else {
    r(ctx, pal.trim, x, y + 12, 16, 6);
    r(ctx, pal.glow, x + 2, y, 12, 12);
    halo(ctx, pal.glow, x - 10, y - 10, 36, 32);
  }
}

/** Sports scoreboard with glowing score blocks. */
export function scoreboard(ctx: Ctx, pal: ThemePalette, x: number, y: number, w: number) {
  const h = 36;
  r(ctx, '#14181d', x, y, w, h);
  r(ctx, pal.trim, x - 3, y - 3, w + 6, 3);
  r(ctx, pal.trim, x - 3, y, 3, h);
  r(ctx, pal.trim, x + w, y, 3, h);
  r(ctx, '#ffd166', x + 8, y + 8, 18, 14); // home score
  r(ctx, '#ffd166', x + w - 26, y + 8, 18, 14); // away score
  r(ctx, '#ff5555', x + w / 2 - 3, y + 10, 6, 4); // clock dots
  r(ctx, '#ff5555', x + w / 2 - 3, y + 18, 6, 4);
  fx(ctx, { kind: 'blink', x: x + w / 2 - 3, y: y + 10, w: 6, h: 12, color: '#ff5555', speed: 1.6 });
  ctx.globalAlpha = 0.5;
  r(ctx, pal.glow, x + 8, y + 26, w - 16, 4); // ticker
  ctx.globalAlpha = 1;
}

/** Stadium flood light hanging from the ceiling with a big warm halo. */
export function floodLight(ctx: Ctx, cx: number, y: number) {
  r(ctx, '#3a3f45', cx - 3, y, 6, 12);
  r(ctx, '#14181d', cx - 22, y + 12, 44, 14);
  for (let i = 0; i < 4; i++) r(ctx, '#fff3c2', cx - 18 + i * 10, y + 15, 7, 8);
  halo(ctx, '#fff3c2', cx - 34, y + 26, 68, 44, 0.14);
}

/**
 * Theme signature pass: stamps wall/ceiling props that make the theme read
 * before any furniture lands. Called by moduleSprite before the kind painter.
 */
export function themeFlavor(ctx: Ctx, room: Interior, pal: ThemePalette, rng: Rng, theme: string) {
  switch (theme) {
    case 'tech': {
      // ceiling cable tray with drooping cable
      r(ctx, pal.furnitureDark, room.x + 8, room.y + 4, room.w - 16, 5);
      ctx.globalAlpha = 0.5;
      for (let cx = room.x + 30; cx < room.x + room.w - 40; cx += 70) {
        r(ctx, pal.trim, cx, room.y + 9, 2, 8);
        r(ctx, pal.trim, cx, room.y + 17, 34, 2);
        r(ctx, pal.trim, cx + 34, room.y + 9, 2, 8);
      }
      ctx.globalAlpha = 1;
      if (room.w > 300) {
        const px = room.x + room.w - 42;
        r(ctx, pal.furnitureDark, px, room.y + 34, 24, 34); // wall console
        r(ctx, pal.accent, px + 4, room.y + 38, 16, 8);
        r(ctx, rng.chance(0.5) ? '#3dff7a' : '#ff5555', px + 4, room.y + 50, 5, 5);
        r(ctx, pal.glow, px + 12, room.y + 50, 5, 5);
      }
      break;
    }
    case 'fantasy': {
      sconce(ctx, pal, theme, room.x + 20, room.y + 40);
      if (room.w > 260) sconce(ctx, pal, theme, room.x + room.w - 36, room.y + 40);
      if (room.w > 380) {
        // hanging banner with emblem
        const bx = room.x + room.w * 0.5 - 22;
        r(ctx, pal.trim, bx - 6, room.y + 4, 56, 5);
        r(ctx, pal.accent, bx, room.y + 9, 44, 54);
        r(ctx, pal.accent, bx + 6, room.y + 63, 32, 8);
        r(ctx, pal.glow, bx + 14, room.y + 26, 16, 18); // emblem
      }
      break;
    }
    case 'realistic': {
      // vertical pipe with valve + ceiling conduit
      const px = room.x + (rng.chance(0.5) ? 10 : room.w - 22);
      r(ctx, pal.trim, px, room.y, 10, room.h);
      r(ctx, pal.furnitureDark, px - 2, room.y + 36, 14, 6);
      disc(ctx, '#a8552f', px + 5, room.y + 70, 7); // valve wheel
      ctx.globalAlpha = 0.5;
      r(ctx, pal.trim, room.x + 8, room.y + 6, room.w - 16, 3);
      ctx.globalAlpha = 1;
      if (room.w > 300) {
        r(ctx, '#e8c46f', room.x + room.w * 0.4, room.y + 34, 26, 22); // hazard sign
        r(ctx, '#14181d', room.x + room.w * 0.4 + 10, room.y + 38, 6, 10);
        r(ctx, '#14181d', room.x + room.w * 0.4 + 10, room.y + 50, 6, 3);
      }
      break;
    }
    case 'cozy': {
      // scalloped string lights along the ceiling
      const step = 26;
      for (let lx = room.x + 10; lx < room.x + room.w - 10; lx += step) {
        const dip = 6 + 5 * Math.sin((lx / step) * Math.PI);
        ctx.globalAlpha = 0.5;
        r(ctx, pal.trim, lx, room.y + 4 + dip, step, 2);
        ctx.globalAlpha = 1;
        r(ctx, '#ffd166', lx + step / 2 - 2, room.y + 7 + dip, 5, 6);
        halo(ctx, '#ffd166', lx + step / 2 - 7, room.y + 5 + dip, 15, 14, 0.2);
      }
      if (room.w > 300) {
        poster(ctx, pal, room.x + room.w * 0.72, room.y + 40, 28, 22);
      }
      break;
    }
    case 'glam': {
      if (room.w > 240 && room.h > 120) {
        ceilingLamp(ctx, pal, 'glam', room.x + room.w * 0.5, room.y);
      }
      // gold skirting + floor sparkles
      r(ctx, '#f5c542', room.x, room.floor - 2, room.w, 2);
      for (let i = 0; i < Math.floor(room.w / 120); i++) {
        const sx = room.x + rng.int(16, room.w - 20);
        const sy = room.y + rng.int(20, room.h - 24);
        r(ctx, '#ffffff', sx, sy - 4, 2, 10);
        r(ctx, '#ffffff', sx - 4, sy, 10, 2);
      }
      break;
    }
  }
}
