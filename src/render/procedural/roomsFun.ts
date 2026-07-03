/**
 * Painters: fun & sports rooms (256 art px per cell).
 * entertainment · gameroom · theater · pool · lava · trampoline · nerf ·
 * junglegym · football · soccer · basketball · baseball
 */
import type { Rng } from './rng';
import {
  ceilingLamp, couch, disc, floodLight, halo, hl, r, ring, rug, scoreboard,
  sh, shadow, table, wallScreen, type Ctx, type Interior, type Painter,
} from './kit';

/** Stepped bleachers with a colorful crowd — makes field halls read as stadiums. */
function bleachers(ctx: Ctx, room: Interior, rng: Rng) {
  const bw = room.w * 0.62;
  const bx = room.x + (room.w - bw) / 2;
  const rows = 3;
  const rowH = 20;
  const topY = room.y + room.h * 0.3;
  const crowd = ['#e86a5a', '#ffd166', '#3a8fd4', '#7fc95c', '#ff8fdc', '#eef2f5'];
  for (let i = 0; i < rows; i++) {
    const y = topY + i * rowH;
    const rowX = bx - i * 14;
    const rowW = bw + i * 28;
    r(ctx, '#3a3f45', rowX, y + 12, rowW, 8); // bench
    sh(ctx, rowX, y + 20, rowW, 4, 0.3);
    for (let cx = rowX + 8; cx < rowX + rowW - 8; cx += rng.int(14, 24)) {
      if (rng.chance(0.7)) {
        const c = crowd[rng.int(0, crowd.length - 1)];
        disc(ctx, c, cx, y + 4, 4); // head
        r(ctx, crowd[rng.int(0, crowd.length - 1)], cx - 4, y + 7, 9, 6); // shirt
        if (rng.chance(0.2)) r(ctx, c, cx - 6, y - 2, 3, 6); // arm up — GOAL!
      }
    }
  }
}

/** Striped turf covering the interior floor area — shared by field rooms. */
function turf(ctx: Ctx, room: Interior, deep = '#3e7d3a', light = '#4c9445') {
  const top = room.floor - 20;
  r(ctx, deep, room.x, top, room.w, 20 + 8);
  const stripe = 64;
  for (let x = room.x, i = 0; x < room.x + room.w; x += stripe, i++) {
    if (i % 2 === 0) r(ctx, light, x, top, Math.min(stripe, room.x + room.w - x), 20);
  }
  hl(ctx, room.x, top, room.w, 3, 0.1);
}

/** Padded gym wall panels — shared by bouncy/battle rooms. */
function paddedWalls(ctx: Ctx, room: Interior, color: string) {
  ctx.globalAlpha = 0.25;
  for (let x = room.x + 36; x < room.x + room.w - 12; x += 36) {
    r(ctx, color, x, room.y + 10, 4, room.h * 0.5);
  }
  ctx.globalAlpha = 1;
}

export const entertainmentP: Painter = (ctx, room, pal, rng, _def, theme) => {
  const sw = room.w * 0.4;
  const sx = room.x + room.w * 0.52;
  wallScreen(ctx, pal, sx, room.y + 24, sw, room.h * 0.52, rng);
  for (const spx of [sx - 32, sx + sw + 12]) {
    shadow(ctx, spx, room.floor, 24);
    r(ctx, pal.furnitureDark, spx, room.floor - 80, 24, 80);
    disc(ctx, pal.trim, spx + 12, room.floor - 66, 7); // tweeter
    disc(ctx, pal.trim, spx + 12, room.floor - 38, 10); // woofer
    disc(ctx, '#0d1117', spx + 12, room.floor - 38, 5);
  }
  rug(ctx, pal, room.x + 20, room.floor, room.w * 0.42);
  couch(ctx, pal, theme, room.x + 16, room.floor, Math.min(160, room.w * 0.34));
  const tx = room.x + room.w * 0.37;
  table(ctx, pal, tx, room.floor, 44);
  r(ctx, pal.glow, tx + 12, room.floor - 54, 20, 14); // popcorn tub
  r(ctx, pal.accent, tx + 16, room.floor - 58, 12, 4);
  // game console + controller
  r(ctx, pal.furnitureDark, tx + 50, room.floor - 12, 26, 12);
  r(ctx, pal.glow, tx + 60, room.floor - 10, 6, 3);
  halo(ctx, pal.accent, room.x + 20, room.y + 4, room.w - 40, 8, 0.12); // LED strip
};

export const gameroomP: Painter = (ctx, room, pal, rng) => {
  // neon zigzag sign
  const nx = room.x + room.w * 0.52;
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 5; i++) r(ctx, pal.accent, nx + i * 16, room.y + 20 + (i % 2) * 12, 16, 6);
  ctx.globalAlpha = 1;
  halo(ctx, pal.accent, nx - 12, room.y + 10, 104, 44, 0.18);
  // arcade cabinets
  const n = room.w > 760 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const ax = room.x + 20 + i * 84;
    shadow(ctx, ax, room.floor, 64);
    r(ctx, pal.furnitureDark, ax, room.floor - 104, 64, 104);
    hl(ctx, ax, room.floor - 104, 6, 104);
    r(ctx, pal.accent, ax + 4, room.floor - 104, 56, 12); // marquee
    halo(ctx, pal.accent, ax, room.floor - 112, 64, 16, 0.2);
    r(ctx, '#0d1117', ax + 8, room.floor - 88, 48, 32); // screen
    r(ctx, pal.glow, ax + 12 + rng.int(0, 16), room.floor - 84, rng.int(8, 20), 6);
    r(ctx, pal.glow, ax + 12 + rng.int(0, 24), room.floor - 72, rng.int(6, 12), 6);
    r(ctx, pal.trim, ax + 8, room.floor - 48, 48, 12); // control deck
    disc(ctx, pal.accent, ax + 18, room.floor - 44, 4); // joystick
    disc(ctx, pal.glow, ax + 34, room.floor - 44, 3);
    disc(ctx, pal.glow, ax + 44, room.floor - 44, 3);
  }
  // dartboard
  const dx = room.x + room.w - 64;
  disc(ctx, pal.trim, dx, room.y + 52, 20);
  disc(ctx, pal.accent, dx, room.y + 52, 14);
  disc(ctx, pal.glow, dx, room.y + 52, 8);
  disc(ctx, '#14181d', dx, room.y + 52, 3);
  r(ctx, '#ffd166', dx - 1, room.y + 38, 2, 10); // stuck dart
  // pool table
  if (room.w > 600) {
    const px = room.x + room.w - 220;
    shadow(ctx, px, room.floor, 176);
    r(ctx, pal.furniture, px, room.floor - 44, 176, 12);
    r(ctx, '#2e7d4f', px + 8, room.floor - 40, 160, 20);
    r(ctx, '#0d1117', px + 8, room.floor - 40, 8, 8);
    r(ctx, '#0d1117', px + 160, room.floor - 40, 8, 8);
    r(ctx, pal.furnitureDark, px + 12, room.floor - 20, 12, 20);
    r(ctx, pal.furnitureDark, px + 152, room.floor - 20, 12, 20);
    disc(ctx, '#ffd166', px + rng.int(30, 120), room.floor - 34, 4);
    disc(ctx, '#ffffff', px + rng.int(30, 140), room.floor - 32, 4);
    r(ctx, pal.trim, px + 40, room.floor - 52, 100, 4); // cue
  }
  ceilingLamp(ctx, pal, 'realistic', room.x + room.w * 0.72, room.y);
};

export const theaterP: Painter = (ctx, room, pal) => {
  // giant screen with marquee bulbs
  const sx = room.x + 16;
  const sw = room.w * 0.44;
  const sh2 = room.h * 0.62;
  r(ctx, '#14181d', sx - 6, room.y + 18, sw + 12, sh2 + 12);
  r(ctx, '#0d1117', sx, room.y + 24, sw, sh2);
  // movie: sunset chase scene, abstract
  r(ctx, '#e86a5a', sx + 8, room.y + 32, sw - 16, sh2 * 0.4);
  r(ctx, '#ffd166', sx + sw * 0.3, room.y + 40, 24, 18); // sun
  r(ctx, '#14181d', sx + 8, room.y + 32 + sh2 * 0.4, sw - 16, sh2 * 0.4);
  r(ctx, pal.glow, sx + sw * 0.2, room.y + 30 + sh2 * 0.55, 20, 10); // car
  disc(ctx, '#14181d', sx + sw * 0.22, room.y + 42 + sh2 * 0.55, 4);
  disc(ctx, '#14181d', sx + sw * 0.32, room.y + 42 + sh2 * 0.55, 4);
  for (let bx = sx - 4; bx < sx + sw + 6; bx += 16) {
    r(ctx, '#ffd166', bx, room.y + 14, 5, 5); // marquee bulbs
    r(ctx, '#ffd166', bx, room.y + 26 + sh2, 5, 5);
  }
  // stepped seat rows on risers
  const rows = 3;
  for (let i = 0; i < rows; i++) {
    const rx = room.x + room.w * 0.52 + i * (room.w * 0.15);
    const ry = room.floor - i * 34;
    r(ctx, pal.furnitureDark, rx, ry - 20, room.w * 0.14, 20); // riser
    for (let s = 0; s < 3; s++) {
      const seatX = rx + 6 + s * 26;
      r(ctx, '#8e2f3c', seatX, ry - 56, 20, 36); // seat back
      hl(ctx, seatX, ry - 56, 20, 4);
      r(ctx, '#6a222d', seatX + 2, ry - 24, 16, 6); // cushion edge
    }
  }
  // projector + beam
  const px = room.x + room.w - 40;
  r(ctx, pal.furnitureDark, px, room.y + 20, 26, 16);
  r(ctx, pal.glow, px - 4, room.y + 24, 4, 8);
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 14; i++) {
    const t = i / 14;
    ctx.fillRect(sx + sw + 10 + t * (px - sx - sw - 14), room.y + 24 + t * 4 - i, px - sx - sw, 8 + i * 2);
  }
  ctx.globalAlpha = 1;
  // popcorn cart + aisle lights
  const cx = room.x + room.w * 0.52;
  r(ctx, '#e86a5a', cx, room.floor - 44, 34, 44);
  r(ctx, pal.glow, cx + 4, room.floor - 38, 26, 18); // glass w/ popcorn
  r(ctx, '#ffd166', cx + 8, room.floor - 36, 4, 4);
  r(ctx, '#ffd166', cx + 16, room.floor - 34, 4, 4);
  for (let ax = room.x + room.w * 0.5; ax < room.x + room.w - 20; ax += 60) {
    r(ctx, '#ffd166', ax, room.floor - 2, 4, 2);
    halo(ctx, '#ffd166', ax - 3, room.floor - 5, 10, 6, 0.3);
  }
};

export const poolP: Painter = (ctx, room, pal, rng) => {
  // tile deck + sunken basin
  ctx.globalAlpha = 0.2;
  for (let tx = room.x; tx < room.x + room.w; tx += 26) r(ctx, '#7fd4d4', tx, room.floor - 60, 2, 60);
  ctx.globalAlpha = 1;
  const bx = room.x + room.w * 0.18;
  const bw = room.w * 0.58;
  r(ctx, '#7fd4d4', bx - 10, room.floor - 34, bw + 20, 8); // coping
  r(ctx, '#1e6a8a', bx, room.floor - 26, bw, 26); // basin
  r(ctx, '#3aa5c9', bx + 4, room.floor - 22, bw - 8, 18); // water
  for (let wx = bx + 10; wx < bx + bw - 20; wx += rng.int(30, 60)) {
    hl(ctx, wx, room.floor - 20 + rng.int(0, 10), rng.int(10, 24), 2, 0.4); // shimmer
  }
  // ladder
  r(ctx, '#eef2f5', bx + bw - 10, room.floor - 44, 4, 40);
  r(ctx, '#eef2f5', bx + bw - 22, room.floor - 44, 4, 40);
  r(ctx, '#eef2f5', bx + bw - 22, room.floor - 38, 16, 3);
  r(ctx, '#eef2f5', bx + bw - 22, room.floor - 26, 16, 3);
  // diving board on a stand
  r(ctx, '#eef2f5', bx - 14, room.floor - 78, 8, 44);
  r(ctx, '#7fd4d4', bx - 18, room.floor - 82, 60, 8);
  hl(ctx, bx - 18, room.floor - 82, 60, 3);
  // splash + beach ball + duck float
  hl(ctx, bx + 30, room.floor - 34, 4, 10, 0.5);
  hl(ctx, bx + 38, room.floor - 30, 3, 6, 0.5);
  disc(ctx, '#e86a5a', bx + bw * 0.55, room.floor - 26, 9);
  r(ctx, '#ffd166', bx + bw * 0.55 - 9, room.floor - 28, 9, 4);
  r(ctx, '#ffffff', bx + bw * 0.55, room.floor - 35, 4, 4);
  r(ctx, '#ffd166', bx + bw * 0.3, room.floor - 28, 16, 8); // duck float
  r(ctx, '#ff9d4d', bx + bw * 0.3 + 14, room.floor - 30, 5, 4);
  // lifeguard chair + sign
  const lx = room.x + room.w - 52;
  r(ctx, '#eef2f5', lx, room.floor - 88, 5, 88);
  r(ctx, '#eef2f5', lx + 24, room.floor - 88, 5, 88);
  r(ctx, '#e86a5a', lx - 2, room.floor - 96, 34, 12);
  for (let ly = room.floor - 70; ly < room.floor - 10; ly += 18) r(ctx, '#eef2f5', lx, ly, 28, 4);
  r(ctx, '#eef2f5', room.x + 10, room.y + 30, 44, 26); // sign
  r(ctx, '#e86a5a', room.x + 14, room.y + 34, 36, 6); // "NO"
  r(ctx, '#1e6a8a', room.x + 14, room.y + 44, 36, 4); // "RUNNING"
  ceilingLamp(ctx, pal, 'realistic', room.x + room.w * 0.5, room.y);
};

export const lavaP: Painter = (ctx, room, pal, rng) => {
  // lava pool with glow layers + bubbles
  const ly = room.floor - 28;
  r(ctx, '#7c1f0e', room.x, ly, room.w, 36);
  r(ctx, '#c9402a', room.x, ly, room.w, 22);
  r(ctx, '#ff7b2e', room.x, ly, room.w, 10);
  halo(ctx, '#ff7b2e', room.x, ly - 14, room.w, 16, 0.25);
  for (let i = 0; i < Math.floor(room.w / 60); i++) {
    const bx = room.x + rng.int(10, room.w - 16);
    disc(ctx, '#ffd166', bx, ly + rng.int(2, 8), rng.int(3, 6)); // bubbles
  }
  // obsidian stepping stones
  for (let sx = room.x + 30; sx < room.x + room.w - 50; sx += rng.int(80, 120)) {
    r(ctx, '#14181d', sx, ly - 8, rng.int(36, 52), 14);
    hl(ctx, sx + 4, ly - 8, 10, 3, 0.25);
  }
  // chain-hung platform
  const px = room.x + room.w * 0.4;
  r(ctx, pal.trim, px + 6, room.y, 3, room.h * 0.4);
  r(ctx, pal.trim, px + 50, room.y, 3, room.h * 0.4);
  r(ctx, '#3a3f45', px - 4, room.y + room.h * 0.4, 68, 10);
  // rock outcrops + half-sunk skull
  r(ctx, '#2b2018', room.x + 4, ly - 22, 30, 22);
  r(ctx, '#2b2018', room.x + room.w - 40, ly - 30, 36, 30);
  disc(ctx, '#eef2f5', room.x + room.w * 0.68, ly + 4, 9);
  r(ctx, '#14181d', room.x + room.w * 0.68 - 5, ly + 1, 4, 4); // eye socket
  r(ctx, '#14181d', room.x + room.w * 0.68 + 2, ly + 1, 4, 4);
  // heat shimmer + warning stripes
  for (let i = 0; i < Math.floor(room.w / 90); i++) {
    hl(ctx, room.x + 20 + i * 90 + rng.int(0, 30), room.y + rng.int(30, 60), 3, rng.int(16, 30), 0.1);
  }
  for (let x = room.x; x < room.x + room.w - 12; x += 24) {
    r(ctx, x % 48 < 24 ? '#ffd166' : '#14181d', x, room.y + room.h * 0.4 + 10, 24, 5);
  }
};

export const trampolineP: Painter = (ctx, room, pal, rng) => {
  paddedWalls(ctx, room, pal.accent);
  // trampolines in a row
  const n = Math.max(2, Math.floor(room.w / 180));
  for (let i = 0; i < n; i++) {
    const tx = room.x + 20 + i * (room.w - 40) / n;
    const tw = (room.w - 60) / n;
    shadow(ctx, tx, room.floor, tw);
    r(ctx, pal.trim, tx + 4, room.floor - 24, 6, 24); // legs
    r(ctx, pal.trim, tx + tw - 10, room.floor - 24, 6, 24);
    r(ctx, '#14181d', tx, room.floor - 30, tw, 8); // mat
    r(ctx, pal.accent, tx - 2, room.floor - 32, tw + 4, 4); // pad ring
    // bounce arc ghost
    ctx.globalAlpha = 0.15;
    ring(ctx, '#ffffff', tx + tw / 2, room.floor - 60, 20, 2);
    ctx.globalAlpha = 1;
  }
  // ball mid-air with motion lines
  const bx = room.x + room.w * 0.35;
  disc(ctx, '#e86a5a', bx, room.y + room.h * 0.35, 10);
  r(ctx, '#ffd166', bx - 10, room.y + room.h * 0.35 - 2, 10, 4);
  hl(ctx, bx - 4, room.y + room.h * 0.35 + 16, 3, 14, 0.3);
  hl(ctx, bx + 4, room.y + room.h * 0.35 + 20, 3, 10, 0.3);
  // foam pit
  const fx = room.x + room.w - 110;
  r(ctx, '#14181d', fx, room.floor - 36, 96, 36);
  const foam = ['#38e1ff', '#ff8fdc', '#ffd166', '#7fc95c', '#c9a5ff'];
  for (let i = 0; i < 24; i++) {
    r(ctx, foam[rng.int(0, foam.length - 1)], fx + 4 + rng.int(0, 84), room.floor - 32 + rng.int(0, 26), 10, 8);
  }
  r(ctx, pal.accent, fx - 4, room.floor - 40, 104, 6); // pit edge pad
};

export const nerfP: Painter = (ctx, room, pal, rng) => {
  paddedWalls(ctx, room, pal.trim);
  const ORANGE = '#ff7b2e';
  const BLUE = '#3a8fd4';
  // angled barricades
  for (let i = 0; i < Math.max(2, Math.floor(room.w / 220)); i++) {
    const bx = room.x + 30 + i * 200;
    const c = i % 2 ? ORANGE : BLUE;
    r(ctx, c, bx, room.floor - 56, 14, 56);
    r(ctx, c, bx + 14, room.floor - 40, 44, 40);
    hl(ctx, bx, room.floor - 56, 14, 6);
    sh(ctx, bx + 14, room.floor - 12, 44, 12, 0.2);
  }
  // darts stuck to the wall (suction side)
  for (let i = 0; i < Math.max(4, Math.floor(room.w / 90)); i++) {
    const dx = room.x + rng.int(16, room.w - 30);
    const dy = room.y + rng.int(24, room.h * 0.5);
    r(ctx, ORANGE, dx, dy, 6, 18);
    disc(ctx, '#3aa5c9', dx + 3, dy, 5); // suction cup
  }
  // target rings
  const tx = room.x + room.w - 70;
  disc(ctx, '#eef2f5', tx, room.y + 60, 24);
  disc(ctx, '#e86a5a', tx, room.y + 60, 17);
  disc(ctx, '#eef2f5', tx, room.y + 60, 10);
  disc(ctx, '#e86a5a', tx, room.y + 60, 4);
  // ammo crate overflowing with darts
  const ax = room.x + room.w * 0.5;
  shadow(ctx, ax, room.floor, 60);
  r(ctx, '#3a5f2a', ax, room.floor - 36, 60, 36);
  hl(ctx, ax, room.floor - 36, 60, 4);
  for (let i = 0; i < 8; i++) {
    r(ctx, ORANGE, ax + 4 + rng.int(0, 48), room.floor - 44 + rng.int(0, 8), 5, 12);
  }
  // blaster on a rack + team flag
  r(ctx, pal.trim, room.x + 14, room.y + room.h * 0.55, 40, 4);
  r(ctx, BLUE, room.x + 18, room.y + room.h * 0.55 - 14, 26, 12);
  r(ctx, ORANGE, room.x + 40, room.y + room.h * 0.55 - 10, 12, 5);
  const fx = room.x + room.w * 0.72;
  r(ctx, pal.trim, fx, room.floor - 90, 4, 90);
  r(ctx, ORANGE, fx + 4, room.floor - 90, 34, 20);
};

export const junglegymP: Painter = (ctx, room, pal, rng) => {
  const WOOD = '#c9762e';
  // monkey bars along the ceiling
  r(ctx, pal.trim, room.x + 20, room.y + 14, room.w * 0.5, 6);
  for (let mx = room.x + 26; mx < room.x + 20 + room.w * 0.5; mx += 26) {
    r(ctx, pal.trim, mx, room.y + 20, 4, 12);
  }
  // platforms + ladders
  const p1x = room.x + 24;
  const p1y = room.floor - room.h * 0.42;
  r(ctx, WOOD, p1x, p1y, room.w * 0.3, 10);
  sh(ctx, p1x, p1y + 10, room.w * 0.3, 4);
  r(ctx, WOOD, p1x + room.w * 0.34, p1y - 34, room.w * 0.22, 10);
  // ladder up to platform 1
  r(ctx, pal.trim, p1x + 10, p1y + 10, 4, room.floor - p1y - 10);
  r(ctx, pal.trim, p1x + 30, p1y + 10, 4, room.floor - p1y - 10);
  for (let ly = p1y + 22; ly < room.floor - 6; ly += 18) r(ctx, pal.trim, p1x + 10, ly, 24, 4);
  // slide from platform 2 (stepped diagonal)
  const sx = p1x + room.w * 0.34;
  const sy = p1y - 24;
  const drop = room.floor - sy;
  for (let i = 0; i < 8; i++) {
    r(ctx, pal.accent, sx - 20 - i * 16, sy + (i * drop) / 8, 26, 10);
  }
  hl(ctx, sx - 20 - 7 * 16, sy + (7 * drop) / 8, 26, 3, 0.3);
  // rope with knots
  const rx = room.x + room.w * 0.68;
  r(ctx, '#8a5f3c', rx, room.y + 20, 4, room.h * 0.5);
  disc(ctx, '#8a5f3c', rx + 2, room.y + 20 + room.h * 0.25, 5);
  disc(ctx, '#8a5f3c', rx + 2, room.y + 20 + room.h * 0.5, 5);
  // rings pair
  r(ctx, pal.trim, rx + 40, room.y + 20, 3, 30);
  ring(ctx, '#ffd166', rx + 41, room.y + 58, 8, 3);
  // ball pit corner
  const bx = room.x + room.w - 120;
  r(ctx, '#14181d', bx, room.floor - 32, 106, 32);
  r(ctx, WOOD, bx - 4, room.floor - 36, 114, 6);
  const balls = ['#38e1ff', '#ff8fdc', '#ffd166', '#7fc95c', '#e86a5a'];
  for (let i = 0; i < 26; i++) {
    disc(ctx, balls[rng.int(0, balls.length - 1)], bx + 8 + rng.int(0, 92), room.floor - 26 + rng.int(0, 18), 5);
  }
};

// --- sports fields ---

function goalPosts(ctx: Ctx, x: number, floor: number, mirror: boolean) {
  const dir = mirror ? -1 : 1;
  r(ctx, '#ffd166', x, floor - 44, 5, 44); // base pole
  r(ctx, '#ffd166', x - 14 * (dir > 0 ? 0 : 1), floor - 48, 20, 5); // crossbar
  r(ctx, '#ffd166', x - (dir > 0 ? 0 : 14), floor - 84, 5, 40); // uprights
  r(ctx, '#ffd166', x + (dir > 0 ? 14 : -14), floor - 84, 5, 40);
}

export const footballP: Painter = (ctx, room, pal, rng) => {
  turf(ctx, room);
  bleachers(ctx, room, rng);
  // yard lines + hashes
  for (let x = room.x + 60; x < room.x + room.w - 40; x += 64) {
    r(ctx, '#eef2f5', x, room.floor - 20, 3, 20);
  }
  // end zones
  r(ctx, '#8e2f3c', room.x, room.floor - 20, 52, 20);
  r(ctx, '#1e4a8a', room.x + room.w - 52, room.floor - 20, 52, 20);
  hl(ctx, room.x + 8, room.floor - 14, 36, 6, 0.2);
  goalPosts(ctx, room.x + 20, room.floor, false);
  goalPosts(ctx, room.x + room.w - 25, room.floor, true);
  scoreboard(ctx, pal, room.x + room.w * 0.5 - 60, room.y + 16, 120);
  floodLight(ctx, room.x + room.w * 0.2, room.y);
  floodLight(ctx, room.x + room.w * 0.8, room.y);
  // bench + cooler
  r(ctx, pal.furnitureDark, room.x + room.w * 0.34, room.floor - 26, 70, 6);
  r(ctx, pal.furnitureDark, room.x + room.w * 0.34 + 6, room.floor - 20, 5, 20);
  r(ctx, pal.furnitureDark, room.x + room.w * 0.34 + 58, room.floor - 20, 5, 20);
  r(ctx, '#ff7b2e', room.x + room.w * 0.34 + 80, room.floor - 24, 18, 24); // cooler
  hl(ctx, room.x + room.w * 0.34 + 80, room.floor - 24, 18, 4);
  // the ball
  disc(ctx, '#8a4b2e', room.x + room.w * 0.55, room.floor - 24, 8);
  r(ctx, '#eef2f5', room.x + room.w * 0.55 - 5, room.floor - 25, 10, 2); // laces
};

export const soccerP: Painter = (ctx, room, pal, rng) => {
  turf(ctx, room);
  bleachers(ctx, room, rng);
  // halfway line + center circle
  const mid = room.x + room.w / 2;
  r(ctx, '#eef2f5', mid - 1, room.floor - 20, 3, 20);
  ring(ctx, '#eef2f5', mid, room.floor - 10, 22, 2);
  // goals with nets
  for (const side of [0, 1]) {
    const gx = side === 0 ? room.x + 8 : room.x + room.w - 60;
    r(ctx, '#eef2f5', gx, room.floor - 64, 4, 64);
    r(ctx, '#eef2f5', gx + 48, room.floor - 64, 4, 64);
    r(ctx, '#eef2f5', gx, room.floor - 66, 52, 4);
    ctx.globalAlpha = 0.3;
    for (let nx = gx + 6; nx < gx + 48; nx += 8) r(ctx, '#ffffff', nx, room.floor - 62, 1, 60);
    for (let ny = room.floor - 58; ny < room.floor; ny += 10) r(ctx, '#ffffff', gx + 4, ny, 44, 1);
    ctx.globalAlpha = 1;
    // penalty box line
    r(ctx, '#eef2f5', side === 0 ? gx + 70 : gx - 22, room.floor - 20, 3, 20);
  }
  // ball with patches
  const bx = mid + 40;
  disc(ctx, '#ffffff', bx, room.floor - 12, 9);
  r(ctx, '#14181d', bx - 3, room.floor - 15, 6, 6);
  r(ctx, '#14181d', bx - 8, room.floor - 9, 4, 4);
  r(ctx, '#14181d', bx + 5, room.floor - 9, 4, 4);
  // corner flags
  r(ctx, '#eef2f5', room.x + 4, room.floor - 34, 3, 34);
  r(ctx, '#e86a5a', room.x + 7, room.floor - 34, 12, 8);
  r(ctx, '#eef2f5', room.x + room.w - 7, room.floor - 34, 3, 34);
  r(ctx, '#e86a5a', room.x + room.w - 19, room.floor - 34, 12, 8);
  scoreboard(ctx, pal, mid - 60, room.y + 16, 120);
  floodLight(ctx, room.x + room.w * 0.25, room.y);
  floodLight(ctx, room.x + room.w * 0.75, room.y);
};

export const basketballP: Painter = (ctx, room, pal, rng) => {
  // hardwood court
  r(ctx, '#c9944a', room.x, room.floor - 22, room.w, 30);
  ctx.globalAlpha = 0.3;
  for (let x = room.x + 30; x < room.x + room.w - 10; x += 60) r(ctx, '#8a5f2e', x, room.floor - 20, 3, 20);
  ctx.globalAlpha = 1;
  hl(ctx, room.x, room.floor - 22, room.w, 4, 0.15);
  bleachers(ctx, room, rng);
  const mid = room.x + room.w / 2;
  r(ctx, '#eef2f5', mid - 1, room.floor - 22, 3, 22);
  ring(ctx, '#e86a5a', mid, room.floor - 10, 20, 2);
  // hoops on both walls
  for (const side of [0, 1]) {
    const hx = side === 0 ? room.x + 14 : room.x + room.w - 14;
    const dir = side === 0 ? 1 : -1;
    const by = room.y + room.h * 0.32;
    r(ctx, '#eef2f5', hx - (dir > 0 ? 0 : 8), by, 8, 34); // backboard
    r(ctx, '#e86a5a', hx + (dir > 0 ? 2 : -6), by + 18, 4, 4); // board square
    r(ctx, '#ff7b2e', hx + (dir > 0 ? 8 : -26), by + 30, 18, 4); // rim
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 4; i++) {
      r(ctx, '#ffffff', hx + (dir > 0 ? 9 + i * 4 : -25 + i * 4), by + 34, 2, 12 - i * 2); // net
    }
    ctx.globalAlpha = 1;
  }
  // ball + bench
  disc(ctx, '#ff7b2e', mid - 50, room.floor - 12, 9);
  r(ctx, '#14181d', mid - 59, room.floor - 13, 18, 2);
  r(ctx, '#14181d', mid - 51, room.floor - 21, 2, 18);
  r(ctx, pal.furnitureDark, mid + 40, room.floor - 26, 70, 6);
  r(ctx, pal.furnitureDark, mid + 46, room.floor - 20, 5, 20);
  r(ctx, pal.furnitureDark, mid + 98, room.floor - 20, 5, 20);
  scoreboard(ctx, pal, mid - 60, room.y + 14, 120);
  floodLight(ctx, room.x + room.w * 0.3, room.y);
  floodLight(ctx, room.x + room.w * 0.7, room.y);
};

export const baseballP: Painter = (ctx, room, pal, rng) => {
  turf(ctx, room, '#3e7d3a', '#4c9445');
  bleachers(ctx, room, rng);
  // dirt infield wedge on the left
  const dx = room.x + 20;
  for (let i = 0; i < 8; i++) {
    r(ctx, '#b5754c', dx + i * 10, room.floor - 20 + i * 2.2, room.w * 0.3 - i * 18, 3);
  }
  r(ctx, '#b5754c', dx, room.floor - 6, room.w * 0.34, 6);
  // bases + home plate + mound
  r(ctx, '#eef2f5', dx + 8, room.floor - 6, 10, 5); // home
  r(ctx, '#eef2f5', dx + room.w * 0.16, room.floor - 14, 9, 5); // second-ish
  r(ctx, '#eef2f5', dx + room.w * 0.28, room.floor - 6, 9, 5); // first
  disc(ctx, '#c9885c', dx + room.w * 0.14, room.floor - 4, 8); // mound
  // foul line
  ctx.globalAlpha = 0.7;
  for (let i = 0; i < 12; i++) r(ctx, '#eef2f5', dx + 14 + i * 24, room.floor - 8 - i * 1.2, 12, 2);
  ctx.globalAlpha = 1;
  // outfield fence with distance marker
  const fx = room.x + room.w - 26;
  r(ctx, '#2e5d2a', fx, room.floor - 52, 16, 52);
  r(ctx, '#ffd166', fx + 3, room.floor - 40, 10, 3); // 400
  r(ctx, '#ffd166', fx + 3, room.floor - 34, 10, 3);
  // bat + helmet + ball
  r(ctx, '#c9762e', dx + 40, room.floor - 8, 34, 5);
  r(ctx, '#c9762e', dx + 70, room.floor - 10, 10, 7);
  disc(ctx, '#1e4a8a', dx + 96, room.floor - 8, 8); // helmet
  r(ctx, '#1e4a8a', dx + 88, room.floor - 8, 16, 6);
  disc(ctx, '#eef2f5', dx + room.w * 0.2, room.floor - 30, 5); // ball mid-air
  r(ctx, '#e86a5a', dx + room.w * 0.2 - 3, room.floor - 30, 2, 2); // stitches
  scoreboard(ctx, pal, room.x + room.w * 0.5 - 60, room.y + 16, 120);
  floodLight(ctx, room.x + room.w * 0.25, room.y);
  floodLight(ctx, room.x + room.w * 0.75, room.y);
};
