/**
 * Per-kind interior painters at the high-detail resolution (128 art px per
 * grid cell). To support a new module kind, add a painter here (or ship final
 * PNGs and skip this entirely). Unknown kinds fall back to a generic room.
 *
 * Painters draw in art-pixel space onto an interior region whose bottom is
 * the floor line. Everything must stay inside the given bounds.
 * Shared vocabulary below: shading (sh/hl/shadow), glow halos, and a prop kit
 * (beds, couches, screens, crates...) so rooms stay visually consistent.
 */
import type { ModuleDef, ThemePalette } from '../../core/types';
import type { Rng } from './rng';

export interface Interior {
  x: number;
  y: number;
  w: number;
  h: number;
  /** y of the floor line props stand on (= y + h). */
  floor: number;
}

export type Painter = (
  ctx: CanvasRenderingContext2D,
  room: Interior,
  pal: ThemePalette,
  rng: Rng,
  def: ModuleDef,
) => void;

type Ctx = CanvasRenderingContext2D;

const r = (ctx: Ctx, color: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

/** Translucent dark shade (depth). */
const sh = (ctx: Ctx, x: number, y: number, w: number, h: number, a = 0.18) => {
  ctx.globalAlpha = a;
  ctx.fillStyle = '#000000';
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  ctx.globalAlpha = 1;
};

/** Translucent light highlight. */
const hl = (ctx: Ctx, x: number, y: number, w: number, h: number, a = 0.14) => {
  ctx.globalAlpha = a;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  ctx.globalAlpha = 1;
};

/** Soft ground shadow under a piece of furniture. */
const shadow = (ctx: Ctx, x: number, floor: number, w: number) => sh(ctx, x, floor - 2, w, 2, 0.25);

/** Glow halo around a light source. */
const halo = (ctx: Ctx, color: string, x: number, y: number, w: number, h: number, a = 0.16) => {
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  ctx.globalAlpha = 1;
};

// --- shared prop kit ---

function ceilingLamp(ctx: Ctx, pal: ThemePalette, cx: number, y: number) {
  r(ctx, pal.trim, cx - 1, y, 3, 10); // cord
  r(ctx, pal.furnitureDark, cx - 10, y + 10, 20, 8); // shade
  r(ctx, pal.furniture, cx - 10, y + 10, 20, 2);
  r(ctx, pal.glow, cx - 6, y + 18, 12, 3); // bulb
  halo(ctx, pal.glow, cx - 14, y + 18, 28, 14);
}

function bed(ctx: Ctx, pal: ThemePalette, x: number, floor: number, w: number) {
  const h = 30;
  shadow(ctx, x, floor, w);
  r(ctx, pal.furnitureDark, x, floor - h - 6, 6, h + 6); // headboard
  r(ctx, pal.furniture, x + 1, floor - h - 5, 4, 2);
  r(ctx, pal.furniture, x + 6, floor - 20, w - 12, 14); // frame
  r(ctx, pal.glow, x + 6, floor - 24, w - 12, 6); // mattress top
  r(ctx, pal.glow, x + 8, floor - 30, 16, 7); // pillow 1
  r(ctx, pal.glow, x + 26, floor - 29, 13, 6); // pillow 2
  hl(ctx, x + 8, floor - 30, 16, 2);
  // blanket with stripes
  const bx = x + 42;
  const bw = w - 48;
  r(ctx, pal.accent, bx, floor - 26, bw, 12);
  ctx.globalAlpha = 0.3;
  for (let s = bx + 6; s < bx + bw - 2; s += 10) r(ctx, pal.furnitureDark, s, floor - 26, 3, 12);
  ctx.globalAlpha = 1;
  r(ctx, pal.furnitureDark, x + 8, floor - 6, 4, 6); // legs
  r(ctx, pal.furnitureDark, x + w - 10, floor - 6, 4, 6);
}

function couch(ctx: Ctx, pal: ThemePalette, x: number, floor: number, w: number) {
  shadow(ctx, x, floor, w);
  r(ctx, pal.furnitureDark, x, floor - 32, 8, 30); // arms
  r(ctx, pal.furnitureDark, x + w - 8, floor - 32, 8, 30);
  hl(ctx, x, floor - 32, 8, 3);
  hl(ctx, x + w - 8, floor - 32, 8, 3);
  r(ctx, pal.furniture, x + 4, floor - 38, w - 8, 14); // back
  r(ctx, pal.accent, x + 8, floor - 24, w - 16, 14); // cushions
  ctx.globalAlpha = 0.3;
  r(ctx, pal.furnitureDark, x + w / 2 - 1, floor - 24, 2, 14); // cushion seam
  ctx.globalAlpha = 1;
  r(ctx, pal.glow, x + 12, floor - 30, 12, 10); // throw pillow
  r(ctx, pal.furnitureDark, x + 8, floor - 10, w - 16, 8); // base
  r(ctx, pal.furnitureDark, x + 6, floor - 4, 4, 4); // feet
  r(ctx, pal.furnitureDark, x + w - 10, floor - 4, 4, 4);
}

function table(ctx: Ctx, pal: ThemePalette, x: number, floor: number, w: number) {
  shadow(ctx, x, floor, w);
  r(ctx, pal.furniture, x, floor - 20, w, 5);
  hl(ctx, x, floor - 20, w, 1);
  ctx.globalAlpha = 0.3;
  r(ctx, pal.furnitureDark, x + 3, floor - 18, w - 6, 1); // grain
  ctx.globalAlpha = 1;
  r(ctx, pal.furnitureDark, x + 3, floor - 15, 4, 15);
  r(ctx, pal.furnitureDark, x + w - 7, floor - 15, 4, 15);
}

function crate(ctx: Ctx, pal: ThemePalette, x: number, y: number, s: number) {
  r(ctx, pal.furniture, x, y, s, s);
  hl(ctx, x, y, s, 2);
  ctx.globalAlpha = 0.4;
  r(ctx, pal.furnitureDark, x + 2, y + Math.floor(s / 3), s - 4, 2);
  r(ctx, pal.furnitureDark, x + 2, y + Math.floor((2 * s) / 3), s - 4, 2);
  ctx.globalAlpha = 1;
  r(ctx, pal.trim, x + Math.floor(s / 2) - 2, y + 1, 4, s - 2); // strap
  r(ctx, pal.accent, x + 3, y + 3, 5, 5); // stencil mark
}

function barrel(ctx: Ctx, pal: ThemePalette, x: number, floor: number) {
  shadow(ctx, x, floor, 18);
  r(ctx, pal.furniture, x, floor - 26, 18, 26);
  hl(ctx, x + 2, floor - 26, 4, 26);
  r(ctx, pal.trim, x, floor - 22, 18, 3);
  r(ctx, pal.trim, x, floor - 9, 18, 3);
}

function wallScreen(ctx: Ctx, pal: ThemePalette, x: number, y: number, w: number, h: number, rng: Rng) {
  r(ctx, pal.furnitureDark, x - 4, y - 4, w + 8, h + 8); // bezel
  hl(ctx, x - 4, y - 4, w + 8, 2);
  r(ctx, '#0d1117', x, y, w, h);
  // content: bars + a jagged data line + a live dot
  const n = Math.max(2, Math.floor(w / 20));
  for (let i = 0; i < n; i++) {
    r(ctx, rng.chance(0.7) ? pal.accent : pal.glow, x + 4 + (i * (w - 8)) / n, y + rng.int(4, h - 12), rng.int(6, 12), rng.int(3, 6));
  }
  ctx.globalAlpha = 0.6;
  let ly = y + h - 8 - rng.int(0, 6);
  for (let lx = x + 3; lx < x + w - 6; lx += 6) {
    r(ctx, pal.glow, lx, ly, 6, 2);
    ly = Math.min(y + h - 4, Math.max(y + 4, ly + rng.int(-4, 4)));
  }
  ctx.globalAlpha = 1;
  r(ctx, pal.glow, x + w - 7, y + 4, 3, 3); // live dot
  ctx.globalAlpha = 0.08; // scanlines
  for (let sy = y + 2; sy < y + h; sy += 4) r(ctx, '#ffffff', x, sy, w, 1);
  ctx.globalAlpha = 1;
}

function shelf(ctx: Ctx, pal: ThemePalette, x: number, y: number, w: number, rows: number, rng: Rng) {
  for (let i = 0; i < rows; i++) {
    const sy = y + i * 22;
    r(ctx, pal.furniture, x, sy + 17, w, 4);
    sh(ctx, x, sy + 21, w, 2);
    let bx = x + 3;
    while (bx < x + w - 9) {
      const bw = rng.int(5, 9);
      const bh = rng.int(11, 16);
      const c = rng.chance(0.4) ? pal.accent : rng.chance(0.5) ? pal.trim : pal.glow;
      r(ctx, c, bx, sy + 17 - bh, bw, bh);
      sh(ctx, bx + bw - 2, sy + 17 - bh, 2, bh, 0.25);
      bx += bw + rng.int(1, 4);
    }
  }
}

function rug(ctx: Ctx, pal: ThemePalette, x: number, floor: number, w: number) {
  r(ctx, pal.accent, x, floor - 4, w, 4);
  r(ctx, pal.trim, x + 5, floor - 3, w - 10, 1);
  for (let fx = x; fx < x + w; fx += 6) r(ctx, pal.trim, fx, floor - 1, 2, 1); // fringe
}

function plant(ctx: Ctx, pal: ThemePalette, x: number, floor: number) {
  shadow(ctx, x, floor, 14);
  r(ctx, pal.furnitureDark, x + 1, floor - 10, 12, 10); // pot
  r(ctx, pal.trim, x, floor - 12, 14, 3);
  r(ctx, pal.accent, x + 6, floor - 26, 3, 14); // stem
  r(ctx, pal.accent, x + 1, floor - 22, 6, 5);
  r(ctx, pal.accent, x + 8, floor - 24, 6, 5);
  r(ctx, pal.glow, x + 5, floor - 30, 5, 5); // new growth
}

function poster(ctx: Ctx, pal: ThemePalette, x: number, y: number, w: number, h: number) {
  r(ctx, pal.trim, x - 2, y - 2, w + 4, h + 4);
  r(ctx, pal.accent, x, y, w, h);
  sh(ctx, x, y + h - Math.floor(h / 3), w, Math.floor(h / 3), 0.3);
  r(ctx, pal.glow, x + Math.floor(w / 4), y + Math.floor(h / 4), Math.floor(w / 3), 3);
}

function sconce(ctx: Ctx, pal: ThemePalette, x: number, y: number) {
  r(ctx, pal.trim, x, y + 6, 8, 3);
  r(ctx, pal.glow, x + 1, y, 6, 6);
  halo(ctx, pal.glow, x - 5, y - 5, 18, 16);
}

// --- kind painters ---

const bedroomP: Painter = (ctx, room, pal, rng) => {
  ceilingLamp(ctx, pal, room.x + room.w * 0.55, room.y);
  rug(ctx, pal, room.x + room.w * 0.3, room.floor, room.w * 0.45);
  bed(ctx, pal, room.x + 8, room.floor, Math.min(70, room.w * 0.45));
  // nightstand + lamp
  const nx = room.x + Math.min(70, room.w * 0.45) + 14;
  table(ctx, pal, nx, room.floor, 20);
  r(ctx, pal.glow, nx + 6, room.floor - 30, 8, 7); // lamp shade
  r(ctx, pal.trim, nx + 9, room.floor - 24, 2, 4);
  halo(ctx, pal.glow, nx, room.floor - 34, 20, 12);
  poster(ctx, pal, room.x + room.w - 60, room.y + 12, 24, 18);
  if (room.w > 200) {
    // dresser with drawers
    const dx = room.x + room.w - 96;
    shadow(ctx, dx, room.floor, 40);
    r(ctx, pal.furniture, dx, room.floor - 34, 40, 34);
    hl(ctx, dx, room.floor - 34, 40, 2);
    for (let d = 0; d < 3; d++) {
      ctx.globalAlpha = 0.4;
      r(ctx, pal.furnitureDark, dx + 3, room.floor - 28 + d * 9, 34, 1);
      ctx.globalAlpha = 1;
      r(ctx, pal.trim, dx + 17, room.floor - 31 + d * 9, 6, 2); // handles
    }
  }
  if (room.w > 300) shelf(ctx, pal, room.x + room.w * 0.5, room.y + 16, 56, 1, rng);
  r(ctx, pal.accent, room.x + 16, room.floor - 3, 5, 3); // slippers
  r(ctx, pal.accent, room.x + 23, room.floor - 3, 5, 3);
};

const kitchenP: Painter = (ctx, room, pal, rng) => {
  // backsplash tiles behind the counter run
  ctx.globalAlpha = 0.2;
  for (let tx = room.x + 4; tx < room.x + room.w - 4; tx += 10) r(ctx, pal.trim, tx, room.floor - 44, 1, 16);
  for (let ty = room.floor - 44; ty < room.floor - 28; ty += 8) r(ctx, pal.trim, room.x + 4, ty, room.w - 8, 1);
  ctx.globalAlpha = 1;
  // counter with cabinet doors + handles
  r(ctx, pal.furniture, room.x + 4, room.floor - 28, room.w - 8, 6);
  hl(ctx, room.x + 4, room.floor - 28, room.w - 8, 2);
  r(ctx, pal.furnitureDark, room.x + 4, room.floor - 22, room.w - 8, 22);
  for (let cx = room.x + 10; cx < room.x + room.w - 20; cx += 26) {
    ctx.globalAlpha = 0.35;
    r(ctx, '#000000', cx + 20, room.floor - 20, 1, 18);
    ctx.globalAlpha = 1;
    r(ctx, pal.trim, cx + 8, room.floor - 16, 5, 2); // handle
  }
  // stove + vent hood
  const sx = room.x + room.w * 0.38;
  r(ctx, pal.trim, sx, room.floor - 30, 32, 30);
  hl(ctx, sx, room.floor - 30, 32, 2);
  r(ctx, pal.furnitureDark, sx + 3, room.floor - 28, 11, 3); // burners
  r(ctx, pal.furnitureDark, sx + 18, room.floor - 28, 11, 3);
  r(ctx, pal.glow, sx + 6, room.floor - 18, 20, 10); // oven window
  sh(ctx, sx + 6, room.floor - 13, 20, 5, 0.3);
  r(ctx, pal.furnitureDark, sx + 4, room.y + 8, 24, 12); // hood
  r(ctx, pal.furnitureDark, sx + 12, room.y, 8, 8); // duct
  // steam over a pot
  r(ctx, pal.glow, sx + 4, room.floor - 36, 10, 6); // pot
  hl(ctx, sx + 2, room.floor - 44, 3, 6, 0.3);
  hl(ctx, sx + 8, room.floor - 48, 3, 8, 0.22);
  // fridge: two doors + handles
  const fx = room.x + room.w - 36;
  shadow(ctx, fx, room.floor, 28);
  r(ctx, pal.trim, fx, room.floor - 52, 28, 52);
  hl(ctx, fx, room.floor - 52, 4, 52);
  ctx.globalAlpha = 0.4;
  r(ctx, pal.furnitureDark, fx + 2, room.floor - 34, 24, 2);
  ctx.globalAlpha = 1;
  r(ctx, pal.accent, fx + 21, room.floor - 48, 3, 10);
  r(ctx, pal.accent, fx + 21, room.floor - 30, 3, 14);
  // upper cabinets + jar shelf
  r(ctx, pal.furniture, room.x + 6, room.y + 8, room.w * 0.3, 18);
  sh(ctx, room.x + 6, room.y + 22, room.w * 0.3, 4);
  for (let cx = room.x + 10; cx < room.x + room.w * 0.3; cx += 24) r(ctx, pal.trim, cx, room.y + 15, 4, 2);
  for (let j = 0; j < 3; j++) {
    r(ctx, rng.chance(0.5) ? pal.accent : pal.glow, room.x + room.w * 0.3 + 14 + j * 10, room.y + 18, 6, 8); // jars
  }
};

const hallwayP: Painter = (ctx, room, pal, rng) => {
  // floor runner
  r(ctx, pal.accent, room.x + 6, room.floor - 4, room.w - 12, 4);
  ctx.globalAlpha = 0.35;
  for (let fx = room.x + 12; fx < room.x + room.w - 12; fx += 14) r(ctx, pal.furnitureDark, fx, room.floor - 4, 4, 4);
  ctx.globalAlpha = 1;
  // wall sconces
  const n = Math.max(1, Math.round(room.w / 90));
  for (let i = 0; i < n; i++) sconce(ctx, pal, room.x + ((i + 0.5) * room.w) / n - 4, room.y + 20);
  // directional sign plate
  const sx = room.x + room.w * 0.5 - 16;
  r(ctx, pal.furnitureDark, sx, room.y + 44, 32, 12);
  r(ctx, pal.accent, sx + 4, room.y + 48, 12, 4);
  r(ctx, pal.accent, sx + 18, room.y + 47, 4, 6); // arrow head
  // skirting stripe + occasional pipe
  r(ctx, pal.trim, room.x, room.floor - 8, room.w, 2);
  if (rng.chance(0.6)) {
    const px = room.x + rng.int(10, Math.max(11, room.w - 16));
    r(ctx, pal.trim, px, room.y + 4, 5, room.h - 10);
    r(ctx, pal.furnitureDark, px, room.y + 20, 5, 3);
    r(ctx, pal.furnitureDark, px, room.y + 50, 5, 3);
  }
};

const bathroomP: Painter = (ctx, room, pal, rng) => {
  // tiled wainscot
  ctx.globalAlpha = 0.18;
  for (let tx = room.x; tx < room.x + room.w; tx += 12) r(ctx, pal.trim, tx, room.floor - 40, 1, 40);
  for (let ty = room.floor - 40; ty < room.floor; ty += 10) r(ctx, pal.trim, room.x, ty, room.w, 1);
  ctx.globalAlpha = 1;
  // toilet
  shadow(ctx, room.x + 8, room.floor, 22);
  r(ctx, '#eef2f5', room.x + 8, room.floor - 26, 6, 18); // tank
  r(ctx, '#eef2f5', room.x + 10, room.floor - 14, 18, 8); // bowl
  r(ctx, '#eef2f5', room.x + 12, room.floor - 6, 6, 6); // base
  sh(ctx, room.x + 10, room.floor - 10, 18, 2, 0.15);
  // pedestal sink + mirror with shine
  const px = room.x + 42;
  r(ctx, '#eef2f5', px, room.floor - 26, 20, 6);
  r(ctx, '#eef2f5', px + 7, room.floor - 20, 6, 20);
  r(ctx, pal.trim, px + 8, room.floor - 29, 4, 3); // tap
  r(ctx, pal.trim, px - 2, room.y + 10, 24, 20); // mirror frame
  r(ctx, '#bfe3f0', px, room.y + 12, 20, 16);
  hl(ctx, px + 2, room.y + 13, 4, 14, 0.5);
  // towel bar
  r(ctx, pal.trim, px + 30, room.y + 26, 22, 2);
  r(ctx, pal.accent, px + 33, room.y + 28, 7, 14);
  r(ctx, pal.glow, px + 42, room.y + 28, 7, 12);
  // tub in wide bathrooms
  if (room.w > 200) {
    const tx = room.x + room.w - 70;
    shadow(ctx, tx, room.floor, 62);
    r(ctx, '#eef2f5', tx, room.floor - 22, 62, 18);
    hl(ctx, tx, room.floor - 22, 62, 3);
    r(ctx, '#9fd8ea', tx + 4, room.floor - 18, 54, 6); // water
    hl(ctx, tx + 8, room.floor - 18, 6, 2, 0.5); // bubbles
    hl(ctx, tx + 20, room.floor - 19, 5, 2, 0.5);
    r(ctx, pal.trim, tx + 2, room.floor - 4, 5, 4); // feet
    r(ctx, pal.trim, tx + 55, room.floor - 4, 5, 4);
    r(ctx, pal.trim, tx + 6, room.floor - 34, 3, 12); // faucet
  }
  r(ctx, pal.accent, room.x + 34, room.floor - 3, 16, 3); // bathmat
  if (rng.chance(0.6)) plant(ctx, pal, room.x + room.w - 22, room.floor);
};

const storageP: Painter = (ctx, room, pal, rng) => {
  // bare bulb on a cord
  const bx = room.x + room.w / 2;
  r(ctx, pal.trim, bx, room.y, 2, 14);
  r(ctx, pal.glow, bx - 3, room.y + 14, 8, 8);
  halo(ctx, pal.glow, bx - 12, room.y + 12, 26, 20);
  // crate stacks
  let x = room.x + 6;
  while (x < room.x + room.w - 30) {
    const s = rng.int(20, 28);
    crate(ctx, pal, x, room.floor - s, s);
    if (rng.chance(0.6)) crate(ctx, pal, x + rng.int(0, 6), room.floor - s - (s - 4), s - 4);
    x += s + rng.int(4, 12);
  }
  barrel(ctx, pal, room.x + room.w - 26, room.floor);
  if (room.w > 140) shelf(ctx, pal, room.x + 8, room.y + 10, room.w - 16, 1, rng);
  // hanging tools
  for (let hx = room.x + 14; hx < room.x + room.w - 20; hx += rng.int(30, 50)) {
    if (rng.chance(0.5)) {
      r(ctx, pal.trim, hx, room.y + 36, 2, 4);
      r(ctx, pal.furnitureDark, hx - 2, room.y + 40, 6, 10);
    }
  }
  // floor hazard corner
  for (let fx = 0; fx < 4; fx++) r(ctx, fx % 2 ? pal.glow : pal.furnitureDark, room.x + 2 + fx * 6, room.floor - 2, 6, 2);
};

const entertainmentP: Painter = (ctx, room, pal, rng) => {
  // giant screen + speaker stacks
  const sw = room.w * 0.42;
  const sx = room.x + room.w * 0.5;
  wallScreen(ctx, pal, sx, room.y + 12, sw, room.h * 0.55, rng);
  for (const spx of [sx - 16, sx + sw + 6]) {
    shadow(ctx, spx, room.floor, 12);
    r(ctx, pal.furnitureDark, spx, room.floor - 40, 12, 40);
    r(ctx, pal.trim, spx + 2, room.floor - 36, 8, 8); // tweeter
    r(ctx, pal.trim, spx + 2, room.floor - 24, 8, 12); // woofer
    sh(ctx, spx + 4, room.floor - 22, 4, 8, 0.4);
  }
  rug(ctx, pal, room.x + 10, room.floor, room.w * 0.42);
  couch(ctx, pal, room.x + 8, room.floor, Math.min(80, room.w * 0.34));
  // popcorn table
  const tx = room.x + room.w * 0.36;
  table(ctx, pal, tx, room.floor, 22);
  r(ctx, pal.glow, tx + 6, room.floor - 27, 10, 7); // popcorn tub
  r(ctx, pal.accent, tx + 8, room.floor - 29, 6, 2);
  // dim light strip on the ceiling
  halo(ctx, pal.accent, room.x + 10, room.y + 2, room.w - 20, 4, 0.12);
};

const livingP: Painter = (ctx, room, pal, rng) => {
  ceilingLamp(ctx, pal, room.x + room.w * 0.32, room.y);
  rug(ctx, pal, room.x + room.w * 0.2, room.floor, room.w * 0.55);
  couch(ctx, pal, room.x + room.w * 0.22, room.floor, Math.min(84, room.w * 0.36));
  table(ctx, pal, room.x + room.w * 0.22 + Math.min(84, room.w * 0.36) + 10, room.floor, 26);
  // fireplace on wide rooms, floor lamp otherwise
  if (room.w > 260) {
    const fx = room.x + room.w - 70;
    r(ctx, pal.furnitureDark, fx, room.floor - 44, 48, 44);
    r(ctx, pal.trim, fx - 3, room.floor - 48, 54, 6); // mantle
    r(ctx, '#1a1410', fx + 10, room.floor - 32, 28, 32); // opening
    r(ctx, '#ff9d4d', fx + 16, room.floor - 16, 16, 12); // fire
    r(ctx, '#ffd166', fx + 20, room.floor - 20, 8, 8);
    halo(ctx, '#ff9d4d', fx + 6, room.floor - 28, 36, 28, 0.2);
    r(ctx, pal.accent, fx + 6, room.floor - 56, 10, 8); // mantle trinkets
    r(ctx, pal.glow, fx + 30, room.floor - 54, 8, 6);
  } else {
    const lx = room.x + room.w - 26;
    r(ctx, pal.trim, lx + 4, room.floor - 40, 3, 40);
    r(ctx, pal.glow, lx, room.floor - 50, 12, 10);
    halo(ctx, pal.glow, lx - 6, room.floor - 54, 24, 18);
  }
  shelf(ctx, pal, room.x + 8, room.y + 14, 48, Math.max(1, Math.floor((room.h - 40) / 22)), rng);
  plant(ctx, pal, room.x + room.w * 0.6, room.floor);
  poster(ctx, pal, room.x + room.w * 0.42, room.y + 12, 20, 16);
  if (rng.chance(0.7)) poster(ctx, pal, room.x + room.w * 0.42 + 26, room.y + 16, 14, 12);
};

const gameroomP: Painter = (ctx, room, pal, rng) => {
  // neon zigzag sign
  const nx = room.x + room.w * 0.5;
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 5; i++) r(ctx, pal.accent, nx + i * 8, room.y + 10 + (i % 2) * 6, 8, 3);
  ctx.globalAlpha = 1;
  halo(ctx, pal.accent, nx - 6, room.y + 4, 52, 22, 0.18);
  // arcade cabinets with marquees
  const n = room.w > 380 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const ax = room.x + 10 + i * 42;
    shadow(ctx, ax, room.floor, 32);
    r(ctx, pal.furnitureDark, ax, room.floor - 52, 32, 52);
    hl(ctx, ax, room.floor - 52, 3, 52);
    r(ctx, pal.accent, ax + 2, room.floor - 52, 28, 6); // marquee
    halo(ctx, pal.accent, ax, room.floor - 56, 32, 8, 0.2);
    r(ctx, '#0d1117', ax + 4, room.floor - 44, 24, 16); // screen
    r(ctx, pal.glow, ax + 6 + rng.int(0, 8), room.floor - 42, rng.int(4, 10), 3);
    r(ctx, pal.glow, ax + 6 + rng.int(0, 12), room.floor - 36, rng.int(3, 6), 3);
    r(ctx, pal.trim, ax + 4, room.floor - 24, 24, 6); // control deck
    r(ctx, pal.accent, ax + 8, room.floor - 23, 3, 3); // joystick ball
    r(ctx, pal.glow, ax + 16, room.floor - 23, 3, 3); // buttons
    r(ctx, pal.glow, ax + 21, room.floor - 23, 3, 3);
  }
  // dartboard
  const dx = room.x + room.w - 34;
  r(ctx, pal.trim, dx - 2, room.y + 14, 20, 20);
  r(ctx, pal.accent, dx + 1, room.y + 17, 14, 14);
  r(ctx, pal.glow, dx + 5, room.y + 21, 6, 6);
  r(ctx, pal.furnitureDark, dx + 7, room.y + 23, 2, 2);
  // pool table on wide rooms
  if (room.w > 300) {
    const px = room.x + room.w - 110;
    shadow(ctx, px, room.floor, 88);
    r(ctx, pal.furniture, px, room.floor - 22, 88, 6); // rails
    r(ctx, pal.accent, px + 4, room.floor - 20, 80, 10); // felt
    r(ctx, '#0d1117', px + 4, room.floor - 20, 4, 4); // pockets
    r(ctx, '#0d1117', px + 80, room.floor - 20, 4, 4);
    r(ctx, pal.furnitureDark, px + 6, room.floor - 10, 6, 10); // legs
    r(ctx, pal.furnitureDark, px + 76, room.floor - 10, 6, 10);
    r(ctx, pal.glow, px + rng.int(14, 60), room.floor - 17, 4, 4); // balls
    r(ctx, '#ffffff', px + rng.int(14, 68), room.floor - 16, 3, 3);
    r(ctx, pal.trim, px + 20, room.floor - 26, 50, 2); // cue resting
  }
  ceilingLamp(ctx, pal, room.x + room.w * 0.72, room.y);
};

const labP: Painter = (ctx, room, pal, rng) => {
  // warning stripe floor edge
  for (let fx = room.x; fx < room.x + room.w - 8; fx += 12) {
    r(ctx, fx % 24 < 12 ? pal.glow : pal.furnitureDark, fx, room.floor - 3, 12, 3);
  }
  // workbench with flasks + bubbles
  const bw = room.w * 0.46;
  r(ctx, pal.trim, room.x + 8, room.floor - 34, bw, 5);
  hl(ctx, room.x + 8, room.floor - 34, bw, 2);
  r(ctx, pal.furnitureDark, room.x + 12, room.floor - 29, 4, 29);
  r(ctx, pal.furnitureDark, room.x + bw - 2, room.floor - 29, 4, 29);
  for (let i = 0; i < 4; i++) {
    const fx = room.x + 18 + i * 22;
    const c = rng.chance(0.5) ? pal.accent : pal.glow;
    r(ctx, c, fx, room.floor - 46, 8, 12);
    r(ctx, pal.trim, fx + 2, room.floor - 50, 4, 4); // neck
    hl(ctx, fx + 1, room.floor - 52, 2, 3, 0.4); // vapor
    if (rng.chance(0.6)) hl(ctx, fx + 3, room.floor - 44, 2, 2, 0.5); // bubble
  }
  // tall specimen tank
  const tx = room.x + room.w - 52;
  r(ctx, pal.furnitureDark, tx, room.y + 14, 40, room.h - 34);
  hl(ctx, tx, room.y + 14, 40, 2);
  r(ctx, pal.accent, tx + 5, room.y + 22, 30, room.h - 54);
  for (let b = 0; b < 5; b++) hl(ctx, tx + 8 + rng.int(0, 22), room.y + 28 + rng.int(0, room.h - 70), 3, 3, 0.4);
  r(ctx, pal.glow, tx + 14, room.y + room.h * 0.4, 12, 10); // the specimen??
  for (let ry = room.y + 20; ry < room.y + room.h - 30; ry += 20) r(ctx, pal.trim, tx - 2, ry, 2, 4); // rivets
  // wall screen + periodic-table poster
  wallScreen(ctx, pal, room.x + 12, room.y + 14, room.w * 0.26, 26, rng);
  const px = room.x + room.w * 0.44;
  r(ctx, pal.trim, px - 2, room.y + 12, 40, 28);
  r(ctx, '#e8e2d0', px, room.y + 14, 36, 24);
  for (let gy = 0; gy < 3; gy++)
    for (let gx = 0; gx < 6; gx++)
      if (rng.chance(0.8)) r(ctx, [pal.accent, pal.glow, pal.furniture][rng.int(0, 2)], px + 2 + gx * 6, room.y + 16 + gy * 7, 4, 5);
  // hanging cables + stool
  r(ctx, pal.trim, room.x + room.w * 0.35, room.y, 2, 22);
  r(ctx, pal.furnitureDark, room.x + bw + 20, room.floor - 18, 3, 18);
  r(ctx, pal.furniture, room.x + bw + 14, room.floor - 22, 15, 4);
};

const commandP: Painter = (ctx, room, pal, rng) => {
  // big world-map screen
  const mw = room.w * 0.4;
  r(ctx, pal.furnitureDark, room.x + 10, room.y + 12, mw + 8, room.h * 0.45 + 8);
  r(ctx, '#0d1826', room.x + 14, room.y + 16, mw, room.h * 0.45);
  for (let i = 0; i < 8; i++) {
    r(ctx, pal.accent, room.x + 18 + rng.int(0, mw - 20), room.y + 20 + rng.int(0, room.h * 0.45 - 12), rng.int(6, 16), rng.int(4, 8)); // continents
  }
  r(ctx, pal.glow, room.x + 14 + rng.int(6, mw - 10), room.y + 20 + rng.int(2, room.h * 0.4), 4, 4); // blip
  // radar: concentric squares + sweep
  const rx = room.x + room.w * 0.56;
  const rs = Math.min(44, room.h * 0.36);
  r(ctx, pal.furnitureDark, rx - 3, room.y + 12, rs + 6, rs + 6);
  r(ctx, '#0d1a12', rx, room.y + 15, rs, rs);
  ctx.globalAlpha = 0.5;
  r(ctx, pal.glow, rx + rs * 0.2, room.y + 15 + rs * 0.2, rs * 0.6, 1);
  r(ctx, pal.glow, rx + rs * 0.1, room.y + 15 + rs * 0.5, rs * 0.8, 1);
  ctx.globalAlpha = 1;
  r(ctx, pal.glow, rx + rs / 2, room.y + 15 + 2, 2, rs / 2 - 2); // sweep
  r(ctx, pal.accent, rx + rs * 0.7, room.y + 15 + rs * 0.3, 3, 3); // bogey
  // smaller status screens fill remaining wall
  for (let sx2 = rx + rs + 14; sx2 < room.x + room.w - 40; sx2 += 46) {
    wallScreen(ctx, pal, sx2, room.y + 14, 36, 24, rng);
  }
  // console desks with chairs
  r(ctx, pal.furniture, room.x + 12, room.floor - 28, room.w - 24, 6);
  hl(ctx, room.x + 12, room.floor - 28, room.w - 24, 2);
  for (let cx = room.x + 20; cx < room.x + room.w - 34; cx += 40) {
    r(ctx, pal.furnitureDark, cx, room.floor - 22, 4, 22);
    r(ctx, pal.accent, cx + 8, room.floor - 26, 16, 3); // glowing keyboard
    halo(ctx, pal.accent, cx + 6, room.floor - 30, 20, 6, 0.12);
    r(ctx, pal.furnitureDark, cx + 10, room.floor - 14, 12, 14); // chair back
    r(ctx, pal.furniture, cx + 8, room.floor - 6, 16, 3);
  }
  // cable cover strip
  sh(ctx, room.x + 10, room.floor - 2, room.w - 20, 2, 0.3);
};

const vaultP: Painter = (ctx, room, pal, rng) => {
  // massive door: ring, spokes, hub, rim bolts
  const cx = room.x + room.w * 0.3;
  const cy = room.y + room.h * 0.48;
  const rad = Math.min(room.h, room.w) * 0.3;
  r(ctx, pal.trim, cx - rad, cy - rad, rad * 2, rad * 2);
  hl(ctx, cx - rad, cy - rad, rad * 2, 3);
  r(ctx, pal.furnitureDark, cx - rad + 7, cy - rad + 7, rad * 2 - 14, rad * 2 - 14);
  r(ctx, pal.trim, cx - rad * 0.55, cy - 2, rad * 1.1, 4); // spokes
  r(ctx, pal.trim, cx - 2, cy - rad * 0.55, 4, rad * 1.1);
  r(ctx, pal.accent, cx - 5, cy - 5, 10, 10); // hub
  hl(ctx, cx - 5, cy - 5, 10, 2);
  for (let a = 0; a < 8; a++) {
    const bx = cx - rad + 2 + (a % 4) * ((rad * 2 - 8) / 3);
    const by = a < 4 ? cy - rad + 2 : cy + rad - 5;
    r(ctx, pal.glow, bx, by, 3, 3); // rim bolts
  }
  // keypad
  r(ctx, pal.furnitureDark, cx + rad + 8, cy - 10, 12, 20);
  r(ctx, pal.glow, cx + rad + 10, cy - 8, 8, 5);
  halo(ctx, pal.glow, cx + rad + 6, cy - 12, 16, 10);
  // treasure: gold stacks + chest with lock
  let gx = room.x + room.w * 0.62;
  for (let row = 0; row < 3; row++) {
    for (let g = 0; g < 3 - row; g++) {
      r(ctx, '#f5c542', gx + g * 14 + row * 7, room.floor - 6 - row * 6, 12, 6);
      hl(ctx, gx + g * 14 + row * 7, room.floor - 6 - row * 6, 12, 2);
    }
  }
  const chx = room.x + room.w - 42;
  shadow(ctx, chx, room.floor, 32);
  r(ctx, pal.furniture, chx, room.floor - 20, 32, 20);
  r(ctx, pal.trim, chx, room.floor - 22, 32, 5);
  r(ctx, pal.glow, chx + 13, room.floor - 14, 6, 7); // lock
  if (rng.chance(0.7)) r(ctx, '#f5c542', chx + 8, room.floor - 26, 5, 4); // spilling coin
};

const garageP: Painter = (ctx, room, pal, rng) => {
  // segmented bay door with window slits
  r(ctx, pal.trim, room.x, room.y + 6, 16, room.h - 8);
  for (let y = room.y + 14; y < room.floor; y += 16) {
    ctx.globalAlpha = 0.4;
    r(ctx, pal.furnitureDark, room.x + 2, y, 12, 2);
    ctx.globalAlpha = 1;
    if (y < room.y + 40) r(ctx, pal.glow, room.x + 5, y + 5, 6, 4);
  }
  // the vehicle
  const vw = Math.min(170, room.w * 0.52);
  const vx = room.x + room.w * 0.2;
  shadow(ctx, vx, room.floor, vw);
  r(ctx, pal.accent, vx + vw * 0.22, room.floor - 46, vw * 0.5, 18); // cabin
  r(ctx, '#bfe3f0', vx + vw * 0.28, room.floor - 42, vw * 0.16, 10); // windshield
  hl(ctx, vx + vw * 0.29, room.floor - 41, 4, 8, 0.5);
  r(ctx, pal.furniture, vx, room.floor - 30, vw, 18); // body
  hl(ctx, vx, room.floor - 30, vw, 3);
  r(ctx, pal.glow, vx + 2, room.floor - 26, 6, 5); // headlight
  halo(ctx, pal.glow, vx - 8, room.floor - 28, 10, 9);
  r(ctx, pal.accent, vx + vw - 6, room.floor - 26, 4, 5); // tail light
  for (const wx of [vx + 16, vx + vw - 34]) {
    r(ctx, '#14181d', wx, room.floor - 14, 20, 14); // tire
    r(ctx, pal.trim, wx + 6, room.floor - 9, 8, 6); // hub
  }
  sh(ctx, vx + 8, room.floor - 20, vw - 16, 4, 0.12); // side shadow
  // workbench + pegboard + tire stack
  const wbx = room.x + room.w - 70;
  r(ctx, pal.trim, wbx, room.floor - 30, 48, 4);
  r(ctx, pal.furnitureDark, wbx + 3, room.floor - 26, 4, 26);
  r(ctx, pal.furnitureDark, wbx + 41, room.floor - 26, 4, 26);
  r(ctx, pal.furnitureDark, wbx + 10, room.floor - 38, 8, 8); // toolbox
  shelf(ctx, pal, wbx - 4, room.y + 12, 52, 1, rng);
  const tsx = room.x + room.w - 92;
  for (let t = 0; t < 3; t++) {
    r(ctx, '#14181d', tsx, room.floor - 8 - t * 8, 18, 8);
    r(ctx, pal.trim, tsx + 7, room.floor - 6 - t * 8, 4, 4);
  }
  // hanging cone lights + oil stain
  ceilingLamp(ctx, pal, vx + vw * 0.3, room.y);
  ceilingLamp(ctx, pal, vx + vw * 0.75, room.y);
  sh(ctx, vx + vw * 0.4, room.floor - 3, 26, 3, 0.25);
};

const elevatorP: Painter = (ctx, room, pal) => {
  // rails with rivets
  for (const rx of [room.x + 6, room.x + room.w - 10]) {
    r(ctx, pal.trim, rx, room.y, 4, room.h);
    for (let ry = room.y + 10; ry < room.y + room.h; ry += 24) r(ctx, pal.furnitureDark, rx + 1, ry, 2, 4);
  }
  // cables + counterweight
  r(ctx, pal.furnitureDark, room.x + room.w / 2 - 2, room.y, 2, room.h * 0.34);
  r(ctx, pal.furnitureDark, room.x + room.w / 2 + 2, room.y, 2, room.h * 0.3);
  r(ctx, pal.furnitureDark, room.x + room.w - 22, room.y + room.h * 0.1, 8, 18); // counterweight
  hl(ctx, room.x + room.w - 22, room.y + room.h * 0.1, 8, 2);
  // cab with split doors + window + indicator
  const cabY = room.y + room.h * 0.34;
  const cabH = room.h * 0.44;
  r(ctx, pal.furniture, room.x + 14, cabY, room.w - 28, cabH);
  hl(ctx, room.x + 14, cabY, room.w - 28, 3);
  r(ctx, pal.glow, room.x + 20, cabY + 8, room.w - 40, 10); // window
  ctx.globalAlpha = 0.5;
  r(ctx, pal.furnitureDark, room.x + room.w / 2 - 1, cabY + 4, 2, cabH - 8); // door split
  ctx.globalAlpha = 1;
  r(ctx, pal.accent, room.x + room.w / 2 - 4, cabY + cabH - 12, 8, 8); // panel
  // floor indicator lights
  for (let i = 0; i < 3; i++) {
    r(ctx, i === 1 ? pal.glow : pal.furnitureDark, room.x + room.w / 2 - 8 + i * 6, room.y + 4, 4, 4);
  }
  halo(ctx, pal.glow, room.x + room.w / 2 - 10, room.y + 2, 20, 8, 0.14);
};

const greenhouseP: Painter = (ctx, room, pal, rng) => {
  // grow lamps with light cones
  for (let x = room.x + 16; x < room.x + room.w - 24; x += 52) {
    r(ctx, pal.trim, x, room.y + 4, 36, 5);
    r(ctx, pal.glow, x + 4, room.y + 9, 28, 3);
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = pal.glow;
    ctx.fillRect(x + 2, room.y + 12, 32, room.h - 24);
    ctx.globalAlpha = 1;
  }
  // raised beds with soil + crops
  let px = room.x + 10;
  while (px < room.x + room.w - 34) {
    const bw = rng.int(26, 38);
    shadow(ctx, px, room.floor, bw);
    r(ctx, pal.furnitureDark, px, room.floor - 16, bw, 16); // planter
    hl(ctx, px, room.floor - 16, bw, 2);
    sh(ctx, px + 2, room.floor - 14, bw - 4, 4, 0.35); // soil
    const stems = rng.int(2, 4);
    for (let s = 0; s < stems; s++) {
      const sx = px + 4 + s * (bw / stems);
      const ph = rng.int(14, Math.min(52, room.h - 40));
      r(ctx, pal.accent, sx, room.floor - 16 - ph, 3, ph);
      r(ctx, pal.accent, sx - 4, room.floor - 16 - ph + 6, 5, 4); // leaves
      r(ctx, pal.accent, sx + 3, room.floor - 16 - ph + 12, 5, 4);
      r(ctx, pal.glow, sx - 1, room.floor - 20 - ph, 5, 5); // bloom
      if (rng.chance(0.5)) r(ctx, '#ff6b5e', sx + 4, room.floor - 16 - ph * 0.5, 4, 4); // tomato!
    }
    px += bw + rng.int(6, 14);
  }
  // hanging vines
  for (let x = room.x + 20; x < room.x + room.w - 12; x += rng.int(34, 56)) {
    const vh = rng.int(18, Math.min(56, room.h * 0.42));
    r(ctx, pal.accent, x, room.y + 10, 3, vh);
    r(ctx, pal.accent, x - 3, room.y + 10 + vh * 0.4, 4, 4);
    r(ctx, pal.glow, x - 1, room.y + 10 + vh, 6, 5);
  }
  // water tank with gauge + drip line
  const tx = room.x + room.w - 30;
  r(ctx, pal.furnitureDark, tx, room.floor - 42, 22, 42);
  hl(ctx, tx, room.floor - 42, 22, 2);
  r(ctx, '#9fd8ea', tx + 4, room.floor - 36, 14, 22);
  r(ctx, pal.glow, tx + 8, room.floor - 12, 6, 4); // gauge
  r(ctx, pal.trim, room.x + 10, room.y + room.h * 0.55, room.w - 44, 2); // drip line
};

const libraryP: Painter = (ctx, room, pal, rng) => {
  // floor-to-ceiling shelves
  const shelfW = room.w * 0.56;
  const rows = Math.max(2, Math.floor((room.h - 16) / 22));
  r(ctx, pal.furniture, room.x + 4, room.y + 8, 4, room.h - 12); // frame
  r(ctx, pal.furniture, room.x + 4 + shelfW, room.y + 8, 4, room.h - 12);
  shelf(ctx, pal, room.x + 8, room.y + 12, shelfW - 4, rows, rng);
  // rolling ladder
  const lx = room.x + shelfW * 0.62;
  r(ctx, pal.trim, lx, room.y + 12, 3, room.h - 22);
  r(ctx, pal.trim, lx + 14, room.y + 12, 3, room.h - 22);
  for (let y = room.y + 18; y < room.floor - 8; y += 14) r(ctx, pal.furniture, lx, y, 17, 3);
  r(ctx, pal.furnitureDark, lx - 1, room.floor - 6, 5, 6); // wheels
  r(ctx, pal.furnitureDark, lx + 13, room.floor - 6, 5, 6);
  // reading nook: armchair + lamp + side table with open book
  const ax = room.x + room.w - 66;
  couch(ctx, pal, ax, room.floor, 40); // reads as an armchair at this width
  const tx2 = ax + 46;
  table(ctx, pal, tx2, room.floor, 18);
  r(ctx, '#f2ecd8', tx2 + 3, room.floor - 24, 12, 4); // open book
  r(ctx, pal.furnitureDark, tx2 + 8, room.floor - 24, 2, 4); // spine
  r(ctx, pal.trim, ax + 50, room.floor - 52, 3, 28); // floor lamp
  r(ctx, pal.glow, ax + 45, room.floor - 60, 13, 9);
  halo(ctx, pal.glow, ax + 38, room.floor - 64, 28, 18);
  // globe
  r(ctx, pal.accent, room.x + shelfW + 16, room.floor - 26, 12, 12);
  hl(ctx, room.x + shelfW + 18, room.floor - 24, 4, 4, 0.4);
  r(ctx, pal.furnitureDark, room.x + shelfW + 20, room.floor - 14, 4, 14);
  rug(ctx, pal, room.x + shelfW + 8, room.floor, room.w * 0.3);
};

const siloP: Painter = (ctx, room, pal) => {
  const cx = room.x + room.w * 0.42;
  const bodyW = Math.min(52, room.w * 0.3);
  const topY = room.y + 16;
  const bodyH = room.floor - topY - 30;
  // steam vents near the floor
  hl(ctx, room.x + 8, room.floor - 30, 8, 12, 0.14);
  hl(ctx, room.x + 18, room.floor - 40, 6, 16, 0.1);
  // rocket body with panel lines + rivets
  r(ctx, pal.trim, cx - bodyW / 2, topY + 20, bodyW, bodyH);
  hl(ctx, cx - bodyW / 2, topY + 20, 6, bodyH, 0.2);
  ctx.globalAlpha = 0.3;
  for (let py = topY + 34; py < topY + bodyH; py += 24) r(ctx, pal.furnitureDark, cx - bodyW / 2 + 2, py, bodyW - 4, 2);
  ctx.globalAlpha = 1;
  r(ctx, pal.accent, cx - bodyW / 2, topY + 20 + bodyH * 0.24, bodyW, 9); // stripe
  r(ctx, pal.furnitureDark, cx - 9, topY + 32, 18, 18); // porthole rim
  r(ctx, pal.glow, cx - 6, topY + 35, 12, 12);
  hl(ctx, cx - 4, topY + 37, 4, 4, 0.5);
  // nose cone
  r(ctx, pal.accent, cx - bodyW / 2 + 6, topY + 8, bodyW - 12, 12);
  r(ctx, pal.accent, cx - 8, topY, 16, 8);
  hl(ctx, cx - 8, topY, 16, 2);
  // fins
  r(ctx, pal.accent, cx - bodyW / 2 - 12, room.floor - 52, 12, 24);
  r(ctx, pal.accent, cx + bodyW / 2, room.floor - 52, 12, 24);
  sh(ctx, cx - bodyW / 2 - 12, room.floor - 34, 12, 6, 0.2);
  // engine bell + glow
  r(ctx, pal.furnitureDark, cx - 12, room.floor - 28, 24, 12);
  r(ctx, pal.furnitureDark, cx - 16, room.floor - 18, 32, 6);
  r(ctx, '#ffd166', cx - 8, room.floor - 12, 16, 6);
  halo(ctx, '#ffd166', cx - 16, room.floor - 12, 32, 10, 0.25);
  // launch pad
  r(ctx, pal.furnitureDark, cx - bodyW / 2 - 16, room.floor - 6, bodyW + 32, 6);
  // gantry tower with cross bracing + arm
  const gx = room.x + room.w - 26;
  r(ctx, pal.furnitureDark, gx, room.y + 12, 16, room.h - 28);
  ctx.globalAlpha = 0.5;
  for (let gy = room.y + 18; gy < room.y + room.h - 28; gy += 16) {
    r(ctx, pal.trim, gx + 1, gy, 14, 2);
  }
  ctx.globalAlpha = 1;
  r(ctx, pal.furniture, cx + bodyW / 2, topY + 44, gx - cx - bodyW / 2, 6); // arm
  sh(ctx, cx + bodyW / 2, topY + 48, gx - cx - bodyW / 2, 2, 0.3);
  // hazard stripes + countdown console
  for (let x = room.x + 2; x < room.x + room.w - 10; x += 14) {
    r(ctx, x % 28 < 14 ? pal.glow : pal.furnitureDark, x, room.floor - 3, 12, 3);
  }
  r(ctx, pal.furnitureDark, room.x + 6, room.floor - 26, 22, 22);
  r(ctx, '#0d1117', room.x + 9, room.floor - 23, 16, 8);
  r(ctx, '#ff5555', room.x + 11, room.floor - 21, 4, 4); // T-minus
  r(ctx, pal.glow, room.x + 17, room.floor - 21, 6, 4);
  r(ctx, pal.accent, room.x + 10, room.floor - 12, 5, 5); // big red button (do not press)
};

/** Fallback for kinds with no painter yet: generic room with accent sign. */
const genericP: Painter = (ctx, room, pal, rng) => {
  ceilingLamp(ctx, pal, room.x + room.w / 2, room.y);
  crate(ctx, pal, room.x + 10, room.floor - 24, 24);
  poster(ctx, pal, room.x + room.w / 2 - 14, room.y + 14, 28, 18);
  if (rng.chance(0.5)) plant(ctx, pal, room.x + room.w - 24, room.floor);
};

export const PAINTERS: Record<string, Painter> = {
  bedroom: bedroomP,
  kitchen: kitchenP,
  hallway: hallwayP,
  bathroom: bathroomP,
  storage: storageP,
  entertainment: entertainmentP,
  living: livingP,
  gameroom: gameroomP,
  lab: labP,
  command: commandP,
  vault: vaultP,
  garage: garageP,
  elevator: elevatorP,
  greenhouse: greenhouseP,
  library: libraryP,
  silo: siloP,
};

export function getPainter(kind: string): Painter {
  return PAINTERS[kind] ?? genericP;
}
