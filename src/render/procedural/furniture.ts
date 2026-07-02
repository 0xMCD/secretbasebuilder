/**
 * Per-kind interior painters for procedural placeholder sprites.
 * To support a new module kind, add a painter here (or ship final PNGs and
 * skip this entirely). Unknown kinds fall back to a generic room.
 *
 * Painters draw in art-pixel space onto an interior region whose bottom is
 * the floor line. Everything must stay inside the given bounds.
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

const r = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

// --- shared prop vocabulary ---

function ceilingLamp(ctx: CanvasRenderingContext2D, pal: ThemePalette, cx: number, y: number) {
  r(ctx, pal.trim, cx - 1, y, 2, 6);
  r(ctx, pal.furnitureDark, cx - 5, y + 6, 10, 5);
  r(ctx, pal.glow, cx - 3, y + 11, 6, 2);
}

function bed(ctx: CanvasRenderingContext2D, pal: ThemePalette, x: number, floor: number, w: number) {
  const h = 14;
  r(ctx, pal.furnitureDark, x, floor - h, 3, h); // headboard
  r(ctx, pal.furniture, x + 3, floor - 10, w - 6, 7); // frame
  r(ctx, pal.glow, x + 4, floor - 13, 10, 4); // pillow
  r(ctx, pal.accent, x + 15, floor - 12, w - 19, 5); // blanket
  r(ctx, pal.furnitureDark, x + 3, floor - 3, 2, 3); // legs
  r(ctx, pal.furnitureDark, x + w - 5, floor - 3, 2, 3);
}

function couch(ctx: CanvasRenderingContext2D, pal: ThemePalette, x: number, floor: number, w: number) {
  r(ctx, pal.furnitureDark, x, floor - 16, 4, 16); // arm
  r(ctx, pal.furnitureDark, x + w - 4, floor - 16, 4, 16); // arm
  r(ctx, pal.furniture, x + 2, floor - 18, w - 4, 6); // back
  r(ctx, pal.accent, x + 4, floor - 12, w - 8, 7); // cushions
  r(ctx, pal.furnitureDark, x + 4, floor - 5, w - 8, 5); // base
}

function table(ctx: CanvasRenderingContext2D, pal: ThemePalette, x: number, floor: number, w: number) {
  r(ctx, pal.furniture, x, floor - 10, w, 3);
  r(ctx, pal.furnitureDark, x + 2, floor - 7, 2, 7);
  r(ctx, pal.furnitureDark, x + w - 4, floor - 7, 2, 7);
}

function crate(ctx: CanvasRenderingContext2D, pal: ThemePalette, x: number, y: number, s: number) {
  r(ctx, pal.furniture, x, y, s, s);
  r(ctx, pal.furnitureDark, x + 1, y + 1, s - 2, 1);
  r(ctx, pal.furnitureDark, x + 1, y + s - 2, s - 2, 1);
  r(ctx, pal.trim, x + s / 2 - 1, y + 1, 2, s - 2);
}

function wallScreen(ctx: CanvasRenderingContext2D, pal: ThemePalette, x: number, y: number, w: number, h: number, rng: Rng) {
  r(ctx, pal.furnitureDark, x - 2, y - 2, w + 4, h + 4);
  r(ctx, pal.roomBg, x, y, w, h);
  // glowing content blocks
  const n = Math.max(2, Math.floor(w / 12));
  for (let i = 0; i < n; i++) {
    const bw = rng.int(4, 8);
    r(ctx, rng.chance(0.7) ? pal.accent : pal.glow, x + 2 + i * (w - 4) / n, y + rng.int(2, h - 8), bw, rng.int(2, 4));
  }
}

function rug(ctx: CanvasRenderingContext2D, pal: ThemePalette, x: number, floor: number, w: number) {
  r(ctx, pal.accent, x, floor - 2, w, 2);
  r(ctx, pal.trim, x + 3, floor - 2, w - 6, 1);
}

function plant(ctx: CanvasRenderingContext2D, pal: ThemePalette, x: number, floor: number) {
  r(ctx, pal.furnitureDark, x, floor - 5, 6, 5);
  r(ctx, pal.accent, x + 1, floor - 12, 4, 7);
  r(ctx, pal.glow, x + 2, floor - 14, 2, 2);
}

function shelf(ctx: CanvasRenderingContext2D, pal: ThemePalette, x: number, y: number, w: number, rows: number, rng: Rng) {
  for (let i = 0; i < rows; i++) {
    const sy = y + i * 10;
    r(ctx, pal.furniture, x, sy + 8, w, 2);
    let bx = x + 2;
    while (bx < x + w - 5) {
      const bw = rng.int(3, 6);
      r(ctx, rng.chance(0.5) ? pal.accent : rng.chance(0.5) ? pal.trim : pal.glow, bx, sy + 2, bw, 6);
      bx += bw + rng.int(1, 3);
    }
  }
}

// --- kind painters ---

const bedroomP: Painter = (ctx, room, pal, rng) => {
  ceilingLamp(ctx, pal, room.x + room.w / 2, room.y);
  bed(ctx, pal, room.x + 4, room.floor, Math.min(34, room.w * 0.45));
  const tx = room.x + Math.min(34, room.w * 0.45) + 8;
  table(ctx, pal, tx, room.floor, 10);
  r(ctx, pal.glow, tx + 3, room.floor - 15, 4, 5); // lamp on table
  rug(ctx, pal, room.x + room.w * 0.35, room.floor, room.w * 0.4);
  if (room.w > 100) shelf(ctx, pal, room.x + room.w - 32, room.y + 8, 26, 2, rng);
  if (rng.chance(0.8)) r(ctx, pal.accent, room.x + room.w - 50, room.y + 6, 12, 9); // poster
};

const kitchenP: Painter = (ctx, room, pal, rng) => {
  // counter run along the floor
  r(ctx, pal.furniture, room.x + 2, room.floor - 14, room.w - 4, 4);
  r(ctx, pal.furnitureDark, room.x + 2, room.floor - 10, room.w - 4, 10);
  // stove with burners + glow oven
  const sx = room.x + room.w * 0.35;
  r(ctx, pal.trim, sx, room.floor - 15, 16, 15);
  r(ctx, pal.furnitureDark, sx + 1, room.floor - 14, 6, 2);
  r(ctx, pal.furnitureDark, sx + 9, room.floor - 14, 6, 2);
  r(ctx, pal.glow, sx + 3, room.floor - 8, 10, 5);
  // fridge
  r(ctx, pal.trim, room.x + room.w - 18, room.floor - 26, 14, 26);
  r(ctx, pal.furnitureDark, room.x + room.w - 17, room.floor - 16, 12, 1);
  r(ctx, pal.accent, room.x + room.w - 8, room.floor - 22, 2, 4); // handle
  // overhead cabinets
  r(ctx, pal.furniture, room.x + 4, room.y + 4, room.w * 0.5, 9);
  for (let cx = room.x + 6; cx < room.x + room.w * 0.5; cx += 12) {
    r(ctx, pal.furnitureDark, cx, room.y + 6, 1, 5);
  }
  if (rng.chance(0.7)) r(ctx, pal.glow, room.x + 8, room.floor - 18, 5, 4); // pot
};

const hallwayP: Painter = (ctx, room, pal, rng) => {
  const n = Math.max(1, Math.round(room.w / 50));
  for (let i = 0; i < n; i++) {
    ceilingLamp(ctx, pal, room.x + ((i + 0.5) * room.w) / n, room.y);
  }
  // skirting stripe + occasional pipe/banner detail
  r(ctx, pal.trim, room.x, room.floor - 4, room.w, 2);
  if (rng.chance(0.6)) {
    const px = room.x + rng.int(4, Math.max(5, room.w - 8));
    r(ctx, pal.accent, px, room.y + 2, 3, room.h - 8);
  }
};

const bathroomP: Painter = (ctx, room, pal, rng) => {
  // toilet
  r(ctx, pal.glow, room.x + 4, room.floor - 8, 9, 8);
  r(ctx, pal.glow, room.x + 4, room.floor - 14, 3, 6); // tank
  // sink + mirror
  const sx = room.x + 20;
  r(ctx, pal.glow, sx, room.floor - 12, 10, 3);
  r(ctx, pal.trim, sx + 4, room.floor - 9, 2, 9);
  r(ctx, pal.accent, sx + 1, room.y + 6, 8, 10); // mirror
  // tub in wide bathrooms
  if (room.w > 80) {
    r(ctx, pal.glow, room.x + room.w - 34, room.floor - 10, 30, 10);
    r(ctx, pal.accent, room.x + room.w - 32, room.floor - 8, 26, 3); // water
  }
  // tile line
  r(ctx, pal.trim, room.x, room.y + room.h * 0.55, room.w, 1);
  if (rng.chance(0.5)) plant(ctx, pal, room.x + room.w - 10, room.floor);
};

const storageP: Painter = (ctx, room, pal, rng) => {
  let x = room.x + 3;
  while (x < room.x + room.w - 14) {
    const s = rng.int(10, 14);
    crate(ctx, pal, x, room.floor - s, s);
    if (rng.chance(0.5)) crate(ctx, pal, x + rng.int(0, 3), room.floor - s - (s - 2), s - 2);
    x += s + rng.int(2, 6);
  }
  if (room.w > 70) shelf(ctx, pal, room.x + 4, room.y + 4, room.w - 8, 1, rng);
  r(ctx, pal.glow, room.x + room.w / 2 - 3, room.y + 2, 6, 2); // bare bulb strip
};

const entertainmentP: Painter = (ctx, room, pal, rng) => {
  wallScreen(ctx, pal, room.x + room.w * 0.42, room.y + 6, room.w * 0.5, room.h * 0.5, rng);
  couch(ctx, pal, room.x + 4, room.floor, Math.min(44, room.w * 0.34));
  table(ctx, pal, room.x + room.w * 0.28, room.floor, 12);
  r(ctx, pal.glow, room.x + room.w * 0.28 + 4, room.floor - 14, 4, 4); // popcorn
  rug(ctx, pal, room.x + room.w * 0.1, room.floor, room.w * 0.5);
};

const livingP: Painter = (ctx, room, pal, rng) => {
  ceilingLamp(ctx, pal, room.x + room.w * 0.5, room.y);
  couch(ctx, pal, room.x + room.w * 0.3, room.floor, Math.min(48, room.w * 0.35));
  table(ctx, pal, room.x + room.w * 0.3 + room.w * 0.38, room.floor, 14);
  shelf(ctx, pal, room.x + 4, room.y + 8, 24, Math.max(2, Math.floor((room.h - 24) / 10)), rng);
  plant(ctx, pal, room.x + room.w - 12, room.floor);
  rug(ctx, pal, room.x + room.w * 0.25, room.floor, room.w * 0.5);
  if (rng.chance(0.7)) r(ctx, pal.accent, room.x + room.w * 0.7, room.y + 8, 14, 10); // picture
};

const gameroomP: Painter = (ctx, room, pal, rng) => {
  // arcade cabinets
  const n = room.w > 200 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const ax = room.x + 6 + i * 22;
    r(ctx, pal.furnitureDark, ax, room.floor - 26, 16, 26);
    r(ctx, pal.accent, ax + 2, room.floor - 23, 12, 8); // screen glow
    r(ctx, pal.glow, ax + 3, room.floor - 22, rng.int(3, 8), 2); // screen content
    r(ctx, pal.trim, ax + 2, room.floor - 12, 12, 3); // controls
  }
  // pool table in wide rooms
  if (room.w > 180) {
    const px = room.x + room.w - 52;
    r(ctx, pal.accent, px, room.floor - 12, 44, 6);
    r(ctx, pal.furnitureDark, px + 2, room.floor - 6, 3, 6);
    r(ctx, pal.furnitureDark, px + 39, room.floor - 6, 3, 6);
    r(ctx, pal.glow, px + rng.int(6, 30), room.floor - 11, 2, 2); // ball
    r(ctx, pal.glow, px + rng.int(6, 34), room.floor - 10, 2, 2);
  }
  ceilingLamp(ctx, pal, room.x + room.w * 0.7, room.y);
};

const labP: Painter = (ctx, room, pal, rng) => {
  // bench with flasks
  r(ctx, pal.trim, room.x + 4, room.floor - 16, room.w * 0.45, 3);
  r(ctx, pal.furnitureDark, room.x + 6, room.floor - 13, 2, 13);
  r(ctx, pal.furnitureDark, room.x + room.w * 0.45 - 2, room.floor - 13, 2, 13);
  for (let i = 0; i < 3; i++) {
    const fx = room.x + 10 + i * 12;
    r(ctx, rng.chance(0.5) ? pal.accent : pal.glow, fx, room.floor - 22, 4, 6);
    r(ctx, pal.trim, fx + 1, room.floor - 24, 2, 2);
  }
  // tall apparatus / tank (rooms are 2 tall)
  const tx = room.x + room.w - 26;
  r(ctx, pal.furnitureDark, tx, room.y + 8, 20, room.h - 20);
  r(ctx, pal.accent, tx + 3, room.y + 12, 14, room.h - 30);
  r(ctx, pal.glow, tx + 6, room.y + rng.int(14, 20), 8, 4); // bubble
  // hanging cables + wall screen
  r(ctx, pal.trim, room.x + room.w * 0.5, room.y, 1, 14);
  wallScreen(ctx, pal, room.x + 8, room.y + 8, room.w * 0.3, 16, rng);
};

const commandP: Painter = (ctx, room, pal, rng) => {
  // wall of screens
  const cols = Math.floor((room.w - 16) / 26);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < 2; j++) {
      wallScreen(ctx, pal, room.x + 8 + i * 26, room.y + 8 + j * 22, 20, 14, rng);
    }
  }
  // console desks
  r(ctx, pal.furniture, room.x + 8, room.floor - 14, room.w - 16, 3);
  for (let cx = room.x + 12; cx < room.x + room.w - 16; cx += 20) {
    r(ctx, pal.furnitureDark, cx, room.floor - 11, 2, 11);
    r(ctx, pal.accent, cx + 4, room.floor - 13, 8, 2); // keyboards glow
  }
  // big chair
  r(ctx, pal.furnitureDark, room.x + room.w / 2 - 4, room.floor - 10, 8, 10);
};

const vaultP: Painter = (ctx, room, pal, rng) => {
  // massive round-ish door (blocky ring)
  const cx = room.x + room.w * 0.3;
  const cy = room.y + room.h * 0.5;
  const rad = Math.min(room.h, room.w) * 0.32;
  r(ctx, pal.trim, cx - rad, cy - rad, rad * 2, rad * 2);
  r(ctx, pal.furnitureDark, cx - rad + 4, cy - rad + 4, rad * 2 - 8, rad * 2 - 8);
  r(ctx, pal.trim, cx - rad * 0.5, cy - 1, rad, 2); // handle spokes
  r(ctx, pal.trim, cx - 1, cy - rad * 0.5, 2, rad);
  r(ctx, pal.accent, cx - 3, cy - 3, 6, 6); // hub
  // treasure
  let gx = room.x + room.w * 0.62;
  for (let i = 0; i < 3; i++) {
    r(ctx, pal.glow, gx, room.floor - 4 - i * 3, 12 - i * 3, 3); // gold stack
    gx += 3;
  }
  if (rng.chance(0.7)) {
    r(ctx, pal.furniture, room.x + room.w - 20, room.floor - 8, 14, 8); // chest
    r(ctx, pal.glow, room.x + room.w - 15, room.floor - 10, 4, 2);
  }
};

const garageP: Painter = (ctx, room, pal, rng) => {
  // segmented bay door on the left
  r(ctx, pal.trim, room.x, room.y + 4, 8, room.h - 4);
  for (let y = room.y + 8; y < room.floor; y += 8) r(ctx, pal.furnitureDark, room.x + 1, y, 6, 1);
  // the vehicle
  const vw = Math.min(90, room.w * 0.55);
  const vx = room.x + room.w * 0.22;
  r(ctx, pal.accent, vx + vw * 0.2, room.floor - 24, vw * 0.55, 10); // cabin
  r(ctx, pal.glow, vx + vw * 0.28, room.floor - 22, vw * 0.18, 6); // windshield
  r(ctx, pal.furniture, vx, room.floor - 15, vw, 9); // body
  r(ctx, pal.furnitureDark, vx + 8, room.floor - 6, 10, 6); // wheels
  r(ctx, pal.furnitureDark, vx + vw - 18, room.floor - 6, 10, 6);
  // tool wall + light
  shelf(ctx, pal, room.x + room.w - 34, room.y + 8, 28, 2, rng);
  ceilingLamp(ctx, pal, vx + vw * 0.5, room.y);
  r(ctx, pal.trim, room.x + room.w - 12, room.floor - 16, 8, 16); // tool cabinet
};

const elevatorP: Painter = (ctx, room, pal, rng) => {
  // shaft rails
  r(ctx, pal.trim, room.x + 4, room.y, 2, room.h);
  r(ctx, pal.trim, room.x + room.w - 6, room.y, 2, room.h);
  // cables
  r(ctx, pal.furnitureDark, room.x + room.w / 2 - 1, room.y, 2, room.h * 0.35);
  // cab
  const cabY = room.y + room.h * 0.35;
  r(ctx, pal.furniture, room.x + 8, cabY, room.w - 16, room.h * 0.4);
  r(ctx, pal.glow, room.x + 12, cabY + 4, room.w - 24, 6); // window
  r(ctx, pal.accent, room.x + room.w / 2 - 2, cabY + room.h * 0.4 - 6, 4, 4); // panel
  if (rng.chance(0.8)) r(ctx, pal.glow, room.x + room.w / 2 - 3, room.y + 2, 6, 2); // floor indicator
};

const greenhouseP: Painter = (ctx, room, pal, rng) => {
  // grow-lamp strips across the ceiling
  for (let x = room.x + 8; x < room.x + room.w - 12; x += 26) {
    r(ctx, pal.trim, x, room.y + 2, 18, 3);
    r(ctx, pal.glow, x + 2, room.y + 5, 14, 2);
  }
  // planter boxes with plants of varying heights
  let px = room.x + 5;
  while (px < room.x + room.w - 16) {
    const bw = rng.int(12, 18);
    r(ctx, pal.furnitureDark, px, room.floor - 8, bw, 8);
    const stems = rng.int(2, 3);
    for (let s = 0; s < stems; s++) {
      const sx = px + 2 + s * (bw / stems);
      const ph = rng.int(8, Math.min(26, room.h - 20));
      r(ctx, pal.accent, sx, room.floor - 8 - ph, 3, ph);
      r(ctx, pal.glow, sx - 2, room.floor - 10 - ph, 7, 4); // leafy top
    }
    px += bw + rng.int(4, 8);
  }
  // hanging vines from the ceiling (tall rooms show them off)
  for (let x = room.x + 14; x < room.x + room.w - 8; x += rng.int(18, 30)) {
    const vh = rng.int(10, Math.min(30, room.h * 0.4));
    r(ctx, pal.accent, x, room.y + 6, 2, vh);
    r(ctx, pal.glow, x - 1, room.y + 6 + vh, 4, 3);
  }
  // water tank
  r(ctx, pal.furnitureDark, room.x + room.w - 14, room.floor - 20, 11, 20);
  r(ctx, pal.glow, room.x + room.w - 12, room.floor - 17, 7, 10);
};

const libraryP: Painter = (ctx, room, pal, rng) => {
  // floor-to-ceiling shelves on the left 60%
  const shelfW = room.w * 0.58;
  const rows = Math.max(2, Math.floor((room.h - 10) / 11));
  shelf(ctx, pal, room.x + 4, room.y + 6, shelfW, rows, rng);
  // rolling ladder: vertical rail + rungs, leaning on the shelves
  const lx = room.x + shelfW * 0.7;
  r(ctx, pal.trim, lx, room.y + 8, 2, room.h - 16);
  r(ctx, pal.trim, lx + 8, room.y + 8, 2, room.h - 16);
  for (let y = room.y + 12; y < room.floor - 4; y += 8) {
    r(ctx, pal.furniture, lx, y, 10, 2);
  }
  // reading nook: desk, lamp, globe
  const dx = room.x + room.w - 34;
  table(ctx, pal, dx, room.floor, 22);
  r(ctx, pal.glow, dx + 3, room.floor - 16, 4, 6); // lamp
  r(ctx, pal.accent, dx + 13, room.floor - 15, 6, 5); // globe
  rug(ctx, pal, room.x + room.w * 0.5, room.floor, room.w * 0.4);
};

const siloP: Painter = (ctx, room, pal, rng) => {
  const cx = room.x + room.w * 0.45;
  const bodyW = Math.min(26, room.w * 0.3);
  const topY = room.y + 10;
  const bodyH = room.floor - topY - 14;
  // rocket body + window + racing stripe
  r(ctx, pal.trim, cx - bodyW / 2, topY + 10, bodyW, bodyH);
  r(ctx, pal.accent, cx - bodyW / 2, topY + 10 + bodyH * 0.25, bodyW, 5);
  r(ctx, pal.glow, cx - 4, topY + 18, 8, 8); // porthole
  // nose cone (stepped)
  r(ctx, pal.accent, cx - bodyW / 2 + 3, topY + 4, bodyW - 6, 6);
  r(ctx, pal.accent, cx - 4, topY, 8, 4);
  // fins
  r(ctx, pal.accent, cx - bodyW / 2 - 6, room.floor - 26, 6, 12);
  r(ctx, pal.accent, cx + bodyW / 2, room.floor - 26, 6, 12);
  // launch pad + thruster
  r(ctx, pal.furnitureDark, cx - bodyW / 2 - 8, room.floor - 6, bodyW + 16, 6);
  r(ctx, pal.glow, cx - 5, room.floor - 13, 10, 7); // engine glow
  // gantry arm from the right wall
  const gx = room.x + room.w - 12;
  r(ctx, pal.furnitureDark, gx, room.y + 8, 8, room.h - 16);
  r(ctx, pal.furniture, cx + bodyW / 2, topY + 22, gx - cx - bodyW / 2, 4);
  // hazard stripes on the floor edge
  for (let x = room.x + 2; x < room.x + room.w - 6; x += 10) {
    if (rng.chance(0.9)) r(ctx, x % 20 < 10 ? pal.glow : pal.furnitureDark, x, room.floor - 2, 8, 2);
  }
  // little control console
  r(ctx, pal.furnitureDark, room.x + 4, room.floor - 12, 12, 12);
  r(ctx, pal.accent, room.x + 6, room.floor - 10, 8, 4);
};

/** Fallback for kinds with no painter yet: generic room with accent sign. */
const genericP: Painter = (ctx, room, pal, rng) => {
  ceilingLamp(ctx, pal, room.x + room.w / 2, room.y);
  crate(ctx, pal, room.x + 6, room.floor - 12, 12);
  r(ctx, pal.accent, room.x + room.w / 2 - 8, room.y + 8, 16, 10);
  if (rng.chance(0.5)) plant(ctx, pal, room.x + room.w - 12, room.floor);
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
