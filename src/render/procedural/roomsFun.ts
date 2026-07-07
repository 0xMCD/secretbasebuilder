/**
 * Painters: fun & sports rooms (256 art px per cell).
 * entertainment · gameroom · theater · pool · lava · trampoline · nerf ·
 * junglegym · football · soccer · basketball · baseball
 */
import { fx } from '../fx';
import type { Rng } from './rng';
import {
  ceilingLamp, couch, disc, floodLight, halo, hl, r, ring, rug, scoreboard,
  sh, shadow, shelf, table, wallScreen, type Ctx, type Interior, type Painter,
} from './kit';

/** Grandstand: raised deck on supports, packed crowd, ad boards, bunting —
 * makes field halls read as real stadiums (fills the tall rooms' upper half). */
function bleachers(ctx: Ctx, room: Interior, rng: Rng) {
  const bw = room.w * 0.86;
  const bx = room.x + (room.w - bw) / 2;
  const rows = room.h > 380 ? 4 : 3;
  const rowH = 20;
  const topY = room.y + room.h * 0.16;
  const deckY = topY + rows * rowH + 14;
  const crowd = ['#e86a5a', '#ffd166', '#3a8fd4', '#7fc95c', '#ff8fdc', '#eef2f5'];
  // back wall band behind the crowd
  sh(ctx, bx - (rows - 1) * 14 - 8, topY - 14, bw + (rows - 1) * 28 + 16, rows * rowH + 22, 0.22);
  for (let i = 0; i < rows; i++) {
    const y = topY + i * rowH;
    const rowX = bx - i * 14;
    const rowW = bw + i * 28;
    r(ctx, '#3a3f45', rowX, y + 12, rowW, 8); // bench
    sh(ctx, rowX, y + 20, rowW, 4, 0.3);
    for (let cx = rowX + 8; cx < rowX + rowW - 8; cx += rng.int(12, 20)) {
      if (rng.chance(0.8)) {
        const c = crowd[rng.int(0, crowd.length - 1)];
        disc(ctx, c, cx, y + 4, 4); // head
        r(ctx, crowd[rng.int(0, crowd.length - 1)], cx - 4, y + 7, 9, 6); // shirt
        if (rng.chance(0.2)) r(ctx, c, cx - 6, y - 2, 3, 6); // arm up — GOAL!
      }
    }
  }
  // stand deck with ad boards along the front edge
  const deckX = bx - (rows - 1) * 14 - 8;
  const deckW = bw + (rows - 1) * 28 + 16;
  r(ctx, '#3a3f45', deckX, deckY, deckW, 10);
  hl(ctx, deckX, deckY, deckW, 3, 0.2);
  const ads = ['#e86a5a', '#3a8fd4', '#7fc95c', '#ffd166'];
  for (let ax = deckX + 6, i = 0; ax < deckX + deckW - 60; ax += 66, i++) {
    r(ctx, ads[i % ads.length], ax, deckY + 10, 58, 14);
    hl(ctx, ax, deckY + 10, 58, 3, 0.3);
    sh(ctx, ax + 8, deckY + 15, 42, 4, 0.25); // "sponsor text"
  }
  // support columns down to the field
  for (let sx = deckX + 20; sx < deckX + deckW - 10; sx += Math.max(90, deckW / 6)) {
    r(ctx, '#2c3138', sx, deckY + 24, 8, room.floor - deckY - 44);
    hl(ctx, sx, deckY + 24, 2, room.floor - deckY - 44, 0.15);
  }
  // pennant bunting hanging below the deck
  const pennants = ['#ffd166', '#e86a5a', '#3a8fd4', '#ff8fdc'];
  for (let px = deckX + 10, i = 0; px < deckX + deckW - 16; px += 26, i++) {
    r(ctx, pennants[i % pennants.length], px, deckY + 26, 12, 10);
    r(ctx, pennants[i % pennants.length], px + 3, deckY + 36, 6, 5);
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
  // air-hockey table in the middle (wide rooms)
  if (room.w > 820) {
    const ahx = room.x + room.w * 0.42;
    const ahw = Math.min(190, room.w * 0.2);
    shadow(ctx, ahx, room.floor, ahw);
    r(ctx, '#3a8fd4', ahx, room.floor - 48, ahw, 14); // rim
    r(ctx, '#eef2f5', ahx + 6, room.floor - 44, ahw - 12, 8); // air surface
    r(ctx, '#e86a5a', ahx + ahw / 2 - 2, room.floor - 44, 4, 8); // center line
    disc(ctx, '#14181d', ahx + ahw * 0.3, room.floor - 40, 4); // puck
    disc(ctx, '#e86a5a', ahx + ahw * 0.72, room.floor - 42, 6); // striker
    r(ctx, pal.furnitureDark, ahx + 10, room.floor - 34, 12, 34); // legs
    r(ctx, pal.furnitureDark, ahx + ahw - 22, room.floor - 34, 12, 34);
    fx(ctx, { kind: 'sparkle', x: ahx + 8, y: room.floor - 44, w: ahw - 16, h: 8, color: '#ffffff', n: 3, speed: 1.6 });
  }
  // framed high-score wall between sign and dartboard
  const hsx = room.x + room.w * 0.72;
  for (let i = 0; i < 3; i++) {
    r(ctx, pal.trim, hsx + i * 34, room.y + 34, 26, 32);
    r(ctx, '#0d1117', hsx + 3 + i * 34, room.y + 38, 20, 24);
    r(ctx, pal.glow, hsx + 6 + i * 34, room.y + 42, 14, 4);
    r(ctx, pal.accent, hsx + 6 + i * 34, room.y + 50, 10, 4);
  }
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
  // giant screen with marquee bulbs, framed by velvet curtains
  const sx = room.x + 34;
  const sw = room.w * 0.42;
  const sh2 = room.h * 0.62;
  r(ctx, '#14181d', sx - 6, room.y + 18, sw + 12, sh2 + 12);
  r(ctx, '#0d1117', sx, room.y + 24, sw, sh2);
  // the movie, composed to FILL the screen: sunset chase
  const my = room.y + 24;
  r(ctx, '#e86a5a', sx, my, sw, sh2 * 0.52); // sunset sky
  r(ctx, '#c9402a', sx, my + sh2 * 0.3, sw, sh2 * 0.22); // horizon band
  disc(ctx, '#ffd166', sx + sw * 0.68, my + sh2 * 0.24, sh2 * 0.16); // giant sun
  for (let m = 0; m < 4; m++) { // mountain silhouettes
    const mw = sw * 0.2;
    const mx = sx + sw * 0.05 + m * sw * 0.24;
    for (let s = 0; s < 5; s++) {
      r(ctx, '#5a2430', mx + s * mw * 0.1, my + sh2 * 0.34 + s * sh2 * 0.035, mw - s * mw * 0.2, sh2 * 0.045);
    }
  }
  r(ctx, '#14181d', sx, my + sh2 * 0.52, sw, sh2 * 0.48); // road at night
  ctx.globalAlpha = 0.7;
  for (let d = 0; d < 5; d++) r(ctx, '#ffd166', sx + sw * 0.08 + d * sw * 0.19, my + sh2 * 0.78, sw * 0.09, sh2 * 0.03); // lane dashes
  ctx.globalAlpha = 1;
  const carW = sw * 0.3; // hero car, big enough to read from the seats
  const carX = sx + sw * 0.3;
  const carY = my + sh2 * 0.58;
  r(ctx, pal.glow, carX + carW * 0.2, carY, carW * 0.55, sh2 * 0.09); // cabin
  r(ctx, pal.glow, carX, carY + sh2 * 0.08, carW, sh2 * 0.1); // body
  r(ctx, '#ffd166', carX + carW * 0.92, carY + sh2 * 0.1, carW * 0.1, sh2 * 0.04); // headlight
  hl(ctx, carX + carW, carY + sh2 * 0.08, sw - (carX - sx) - carW, sh2 * 0.12, 0.12); // beam
  disc(ctx, '#2c3138', carX + carW * 0.2, carY + sh2 * 0.19, sh2 * 0.045);
  disc(ctx, '#2c3138', carX + carW * 0.8, carY + sh2 * 0.19, sh2 * 0.045);
  for (let bx = sx - 4; bx < sx + sw + 6; bx += 16) {
    r(ctx, '#ffd166', bx, room.y + 14, 5, 5); // marquee bulbs
    r(ctx, '#ffd166', bx, room.y + 26 + sh2, 5, 5);
  }
  // velvet curtains flanking the screen, full height
  for (const cxx of [room.x + 4, sx + sw + 12]) {
    r(ctx, '#8e2f3c', cxx, room.y + 10, 22, room.h - 14);
    hl(ctx, cxx + 2, room.y + 10, 4, room.h - 14, 0.18);
    sh(ctx, cxx + 12, room.y + 10, 6, room.h - 14, 0.25);
    r(ctx, '#f5c542', cxx - 2, room.y + room.h * 0.45, 26, 8); // gold tieback
  }
  // stepped seat rows on risers — packed, scaling with the room
  const seatAreaX = sx + sw + 48;
  const seatAreaW = room.x + room.w - seatAreaX - 76;
  const rows = room.h > 380 ? 3 : 2;
  const rowW = seatAreaW / rows;
  for (let i = 0; i < rows; i++) {
    const rx = seatAreaX + i * rowW;
    const riserH = 14 + i * 22;
    r(ctx, pal.furnitureDark, rx, room.floor - riserH, rowW, riserH); // riser
    hl(ctx, rx, room.floor - riserH, rowW, 3, 0.15);
    const seats = Math.max(2, Math.floor((rowW - 10) / 30));
    for (let s = 0; s < seats; s++) {
      const seatX = rx + 6 + s * ((rowW - 12) / seats);
      const seatY = room.floor - riserH;
      r(ctx, '#8e2f3c', seatX, seatY - 40, 20, 40); // seat back
      hl(ctx, seatX, seatY - 40, 20, 4);
      r(ctx, '#6a222d', seatX + 2, seatY - 14, 22, 8); // cushion
      r(ctx, '#5a1c26', seatX + 18, seatY - 26, 6, 14); // armrest
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
  // popcorn cart by the entrance + riser step lights
  const cx = room.x + room.w - 56;
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
  fx(ctx, { kind: 'shimmer', x: bx + 4, y: room.floor - 22, w: bw - 8, h: 14, color: '#bfe9f5' });
  // ladder
  r(ctx, '#eef2f5', bx + bw - 10, room.floor - 44, 4, 40);
  r(ctx, '#eef2f5', bx + bw - 22, room.floor - 44, 4, 40);
  r(ctx, '#eef2f5', bx + bw - 22, room.floor - 38, 16, 3);
  r(ctx, '#eef2f5', bx + bw - 22, room.floor - 26, 16, 3);
  // diving board on a stand
  r(ctx, '#eef2f5', bx - 14, room.floor - 78, 8, 44);
  r(ctx, '#7fd4d4', bx - 18, room.floor - 82, 60, 8);
  hl(ctx, bx - 18, room.floor - 82, 60, 3);
  // high-dive tower over the deep end
  const hdx = bx + bw * 0.16;
  r(ctx, '#eef2f5', hdx, room.y + room.h * 0.2, 8, room.floor - 34 - (room.y + room.h * 0.2));
  for (let ry = room.y + room.h * 0.24; ry < room.floor - 44; ry += 22) {
    r(ctx, '#c9d4da', hdx - 5, ry, 18, 4); // ladder rungs
  }
  r(ctx, '#7fd4d4', hdx - 4, room.y + room.h * 0.2, 52, 8); // top platform
  hl(ctx, hdx - 4, room.y + room.h * 0.2, 52, 3);
  r(ctx, '#7fd4d4', hdx - 4, room.y + room.h * 0.42, 40, 7); // mid platform
  r(ctx, '#e86a5a', hdx + 40, room.y + room.h * 0.2 - 12, 10, 12); // flag on top
  // water slide winding in from the right wall
  const slTopX = room.x + room.w - 118;
  const slTopY = room.y + room.h * 0.24;
  r(ctx, '#eef2f5', slTopX + 10, slTopY, 8, room.floor - slTopY - 30); // support mast
  r(ctx, '#7fd4d4', slTopX - 8, slTopY - 8, 64, 10); // launch platform
  hl(ctx, slTopX - 8, slTopY - 8, 64, 3);
  const slideEndX = bx + bw * 0.7;
  const steps = 22; // many small chunks → contiguous ribbon
  const span = slTopX - slideEndX;
  const drop = room.floor - 46 - slTopY;
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const x0 = slTopX - span * t0;
    const y0 = slTopY + drop * t0 * t0; // accelerating drop
    const segW = span / steps + 6;
    r(ctx, '#5cb85c', x0 - segW, y0, segW + 3, 13); // flume
    r(ctx, '#3e8f3e', x0 - segW, y0 + 10, segW + 3, 3); // underside shade
    if (i % 6 === 3) r(ctx, '#eef2f5', x0 - segW / 2, y0 + 13, 6, room.floor - y0 - 13); // leg
  }
  hl(ctx, slTopX - span * 0.15, slTopY + drop * 0.02, span * 0.16, 4, 0.35); // water sheen down the top run
  hl(ctx, slideEndX - 20, room.floor - 36, 22, 8, 0.5); // splash at the outlet
  fx(ctx, { kind: 'shimmer', x: slideEndX - 26, y: room.floor - 40, w: 40, h: 10, color: '#dff3ff', n: 2, speed: 1.4 });
  // swim-meet pennant bunting across the ceiling
  const flags = ['#e86a5a', '#ffd166', '#7fd4d4', '#eef2f5'];
  for (let fxp = room.x + 16, i = 0; fxp < room.x + room.w - 20; fxp += 30, i++) {
    const dip = Math.sin((i / 5) * Math.PI) * 8;
    r(ctx, flags[i % flags.length], fxp, room.y + 14 + dip, 12, 12);
    r(ctx, flags[i % flags.length], fxp + 3, room.y + 26 + dip, 6, 5);
  }
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
  fx(ctx, { kind: 'bubble', x: room.x + 6, y: ly - 10, w: room.w - 12, h: 20, color: '#ffd166', speed: 0.7 });
  fx(ctx, { kind: 'shimmer', x: room.x + 10, y: room.y + 24, w: room.w - 20, h: room.h * 0.3, color: '#ffffff', n: 3, speed: 0.6 });
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
  // angled wall-trampoline at the left (park signature move)
  for (let i = 0; i < 6; i++) {
    r(ctx, '#3a8fd4', room.x + 8 + i * 10, room.floor - 130 + i * 18, 14, 14);
    r(ctx, pal.accent, room.x + 4 + i * 10, room.floor - 134 + i * 18, 8, 8); // pad edge
  }
  // hanging rings pair over the beds
  for (const rx of [room.x + room.w * 0.36, room.x + room.w * 0.5]) {
    r(ctx, pal.trim, rx, room.y + 8, 3, room.h * 0.3);
    ring(ctx, '#ffd166', rx + 1, room.y + 12 + room.h * 0.3, 9, 3);
  }
  // bounce-arrows neon sign (up-up-up!)
  const sgx = room.x + room.w * 0.62;
  r(ctx, '#14181d', sgx - 10, room.y + 18, 96, 44);
  for (let a = 0; a < 3; a++) {
    const ax = sgx + a * 28;
    const ay = room.y + 48 - a * 8;
    r(ctx, pal.glow, ax, ay, 18, 5); // chevron arms
    r(ctx, pal.glow, ax + 3, ay - 5, 12, 5);
    r(ctx, pal.glow, ax + 6, ay - 10, 6, 5);
  }
  halo(ctx, pal.glow, sgx - 14, room.y + 16, 104, 50, 0.14);
  // trampoline beds: chunky frames, blue mats, spring ticks, pad rings
  const n = Math.max(2, Math.floor(room.w / 260));
  const span2 = room.w - 80 - Math.min(200, room.w * 0.24); // leave room for foam pit
  for (let i = 0; i < n; i++) {
    const tw = span2 / n - 24;
    const tx = room.x + 56 + i * (span2 / n);
    shadow(ctx, tx, room.floor, tw);
    r(ctx, pal.trim, tx + 4, room.floor - 30, 8, 30); // legs
    r(ctx, pal.trim, tx + tw - 12, room.floor - 30, 8, 30);
    r(ctx, '#2c3138', tx - 4, room.floor - 44, tw + 8, 12); // frame rail
    r(ctx, '#3a8fd4', tx + 8, room.floor - 40, tw - 16, 8); // mat
    hl(ctx, tx + 8, room.floor - 40, tw - 16, 3, 0.25);
    for (let s = tx + 4; s < tx + tw - 6; s += 12) r(ctx, '#eef2f5', s, room.floor - 36, 3, 2); // springs
    r(ctx, '#e86a5a', tx - 6, room.floor - 48, tw + 12, 6); // safety pad ring
  }
  // ball mid-air with motion lines
  const bx = room.x + room.w * 0.3;
  disc(ctx, '#e86a5a', bx, room.y + room.h * 0.38, 10);
  r(ctx, '#ffd166', bx - 10, room.y + room.h * 0.38 - 2, 10, 4);
  hl(ctx, bx - 4, room.y + room.h * 0.38 + 16, 3, 14, 0.3);
  hl(ctx, bx + 4, room.y + room.h * 0.38 + 20, 3, 10, 0.3);
  // foam pit, big enough to actually dive into
  const fpw = Math.min(200, room.w * 0.24);
  const fx2 = room.x + room.w - fpw - 14;
  r(ctx, '#14181d', fx2, room.floor - 44, fpw, 44);
  const foam = ['#38e1ff', '#ff8fdc', '#ffd166', '#7fc95c', '#c9a5ff'];
  for (let i = 0; i < Math.floor(fpw / 4); i++) {
    r(ctx, foam[rng.int(0, foam.length - 1)], fx2 + 4 + rng.int(0, fpw - 16), room.floor - 40 + rng.int(0, 32), 11, 9);
  }
  r(ctx, pal.accent, fx2 - 4, room.floor - 48, fpw + 8, 6); // pit edge pad
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
  // monkey bars along most of the ceiling, with swing rings
  r(ctx, pal.trim, room.x + 20, room.y + 14, room.w * 0.72, 6);
  for (let mx = room.x + 26; mx < room.x + 20 + room.w * 0.72; mx += 26) {
    r(ctx, pal.trim, mx, room.y + 20, 4, 12);
  }
  for (const rgx of [room.x + room.w * 0.22, room.x + room.w * 0.5]) {
    r(ctx, '#8a5f3c', rgx, room.y + 20, 3, 26);
    ring(ctx, '#ffd166', rgx + 1, room.y + 52, 8, 3);
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
  // cargo net from platform 1's edge down to the floor
  const netX = p1x + room.w * 0.3 - 14;
  const netW = 64;
  const netH = room.floor - p1y - 10;
  ctx.globalAlpha = 0.75;
  for (let i = 0; i <= 4; i++) r(ctx, '#8a5f3c', netX + (i * netW) / 4, p1y + 10, 3, netH);
  for (let j = 1; j <= 4; j++) r(ctx, '#8a5f3c', netX, p1y + 10 + (j * netH) / 5, netW, 3);
  ctx.globalAlpha = 1;
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
  // ball pit corner, widened
  const bpw = Math.min(180, room.w * 0.22);
  const bx = room.x + room.w - bpw - 14;
  r(ctx, '#14181d', bx, room.floor - 32, bpw, 32);
  r(ctx, WOOD, bx - 4, room.floor - 36, bpw + 8, 6);
  const balls = ['#38e1ff', '#ff8fdc', '#ffd166', '#7fc95c', '#e86a5a'];
  for (let i = 0; i < Math.floor(bpw / 4); i++) {
    disc(ctx, balls[rng.int(0, balls.length - 1)], bx + 8 + rng.int(0, bpw - 16), room.floor - 26 + rng.int(0, 18), 5);
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
  scoreboard(ctx, pal, room.x + room.w * 0.5 - Math.max(60, room.w * 0.07), room.y + 16, Math.max(120, room.w * 0.14));
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
  scoreboard(ctx, pal, mid - Math.max(60, room.w * 0.07), room.y + 16, Math.max(120, room.w * 0.14));
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
  scoreboard(ctx, pal, mid - Math.max(60, room.w * 0.07), room.y + 14, Math.max(120, room.w * 0.14));
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
  scoreboard(ctx, pal, room.x + room.w * 0.5 - Math.max(60, room.w * 0.07), room.y + 16, Math.max(120, room.w * 0.14));
  floodLight(ctx, room.x + room.w * 0.25, room.y);
  floodLight(ctx, room.x + room.w * 0.75, room.y);
};

export const vrroomP: Painter = (ctx, room, pal, rng) => {
  // boundary grid glow on the walls
  ctx.globalAlpha = 0.12;
  for (let gx = room.x + 20; gx < room.x + room.w - 10; gx += 30) r(ctx, pal.accent, gx, room.y + 10, 2, room.h - 20);
  for (let gy = room.y + 20; gy < room.floor - 10; gy += 30) r(ctx, pal.accent, room.x + 10, gy, room.w - 20, 2);
  ctx.globalAlpha = 1;
  // play mat
  r(ctx, pal.accent, room.x + room.w * 0.28, room.floor - 6, room.w * 0.44, 6);
  hl(ctx, room.x + room.w * 0.28, room.floor - 6, room.w * 0.44, 2, 0.3);
  // headset on a stand
  const hx = room.x + 28;
  r(ctx, pal.trim, hx + 10, room.floor - 56, 5, 56);
  r(ctx, pal.furnitureDark, hx, room.floor - 70, 26, 16); // headset
  r(ctx, pal.glow, hx + 3, room.floor - 66, 20, 6); // lens strip
  halo(ctx, pal.glow, hx - 6, room.floor - 74, 38, 22, 0.2);
  // floating controllers with motion trails
  const cxm = room.x + room.w * 0.5;
  disc(ctx, pal.glow, cxm - 20, room.y + room.h * 0.5, 6);
  disc(ctx, pal.glow, cxm + 24, room.y + room.h * 0.42, 6);
  hl(ctx, cxm - 34, room.y + room.h * 0.52, 12, 3, 0.3);
  hl(ctx, cxm + 32, room.y + room.h * 0.44, 12, 3, 0.3);
  // wall screen mirroring the game
  wallScreen(ctx, pal, room.x + room.w - 118, room.y + 22, 96, 60, rng);
  // ceiling cable to headset zone
  r(ctx, pal.trim, cxm, room.y, 3, 26);
  r(ctx, pal.trim, cxm, room.y + 26, 20, 3);
};

export const gamingdenP: Painter = (ctx, room, pal, rng) => {
  halo(ctx, pal.accent, room.x + 12, room.y + 4, room.w - 24, 6, 0.18); // RGB strip
  // battlestation: desk + triple monitors + tower
  const dx = room.x + 16;
  r(ctx, pal.furniture, dx, room.floor - 52, 120, 8);
  r(ctx, pal.furnitureDark, dx + 8, room.floor - 44, 6, 44);
  r(ctx, pal.furnitureDark, dx + 106, room.floor - 44, 6, 44);
  for (let m = 0; m < 3; m++) {
    const mx = dx + 6 + m * 38;
    r(ctx, '#0d1117', mx, room.floor - 88, 34, 26);
    r(ctx, pal.glow, mx + 3, room.floor - 85, rng.int(10, 26), 6);
    r(ctx, pal.accent, mx + 3, room.floor - 74, rng.int(8, 20), 5);
    r(ctx, pal.trim, mx + 14, room.floor - 62, 6, 10); // stand
  }
  r(ctx, pal.glow, dx + 20, room.floor - 50, 30, 4); // RGB keyboard
  // PC tower with RGB
  const px = dx + 128;
  shadow(ctx, px, room.floor, 34);
  r(ctx, '#14181d', px, room.floor - 72, 34, 72);
  r(ctx, pal.accent, px + 4, room.floor - 66, 4, 60); // light strip
  disc(ctx, pal.glow, px + 20, room.floor - 52, 8); // fan
  disc(ctx, pal.accent, px + 20, room.floor - 28, 8);
  // gaming chair
  const gx = dx + 40;
  shadow(ctx, gx, room.floor, 40);
  r(ctx, '#e8342a', gx + 8, room.floor - 78, 26, 48); // tall back
  r(ctx, '#14181d', gx + 12, room.floor - 70, 18, 30);
  r(ctx, '#e8342a', gx + 2, room.floor - 30, 38, 10);
  r(ctx, pal.furnitureDark, gx + 18, room.floor - 20, 6, 14);
  r(ctx, pal.furnitureDark, gx + 6, room.floor - 6, 30, 4);
  // TV + console corner
  if (room.w > 500) {
    const tx = room.x + room.w - 150;
    wallScreen(ctx, pal, tx, room.y + 30, 120, 66, rng);
    r(ctx, pal.furniture, tx + 10, room.floor - 30, 100, 6);
    r(ctx, '#14181d', tx + 26, room.floor - 42, 40, 12); // console
    r(ctx, pal.glow, tx + 30, room.floor - 39, 4, 4);
    disc(ctx, pal.furnitureDark, tx + 78, room.floor - 36, 7); // controller
    disc(ctx, pal.furnitureDark, tx + 90, room.floor - 36, 7);
  }
  // headset stand + cans
  r(ctx, pal.trim, room.x + room.w - 26, room.floor - 44, 4, 44);
  r(ctx, pal.furnitureDark, room.x + room.w - 34, room.floor - 52, 20, 10);
  for (let i = 0; i < 3; i++) r(ctx, ['#7fc95c', '#38e1ff', '#e8342a'][i], dx + 60 + i * 10, room.floor - 60, 7, 12); // energy cans
};

export const dinoexhibitP: Painter = (ctx, room, pal) => {
  const BONE = '#efe8d8';
  // display platform + spotlight
  const px = room.x + room.w * 0.12;
  const pw = room.w * 0.66;
  r(ctx, pal.furnitureDark, px, room.floor - 14, pw, 14);
  hl(ctx, px, room.floor - 14, pw, 4);
  halo(ctx, '#fff3c2', px + pw * 0.2, room.y + 10, pw * 0.6, room.h - 40, 0.07); // spotlight wash
  r(ctx, '#14181d', px + pw * 0.45, room.y + 4, 22, 10); // spot fixture
  r(ctx, '#fff3c2', px + pw * 0.45 + 5, room.y + 14, 12, 4);
  const base = room.floor - 14;
  // T-rex skeleton, scaled to the hall (occupies ~2/3 of its height)
  const legH = room.h * 0.34;
  const boneW = Math.max(8, Math.round(room.h * 0.035));
  const hipX = px + pw * 0.52;
  r(ctx, BONE, hipX, base - legH, boneW, legH); // back leg
  r(ctx, BONE, hipX - 10, base - 8, boneW + 20, 8); // foot
  r(ctx, BONE, px + pw * 0.3, base - legH * 0.8, boneW - 2, legH * 0.8); // front leg
  r(ctx, BONE, px + pw * 0.3 - 8, base - 8, boneW + 16, 8);
  // spine: rising arc toward the head
  const spineY = base - legH - boneW;
  const rise = room.h * 0.028;
  for (let i = 0; i < 9; i++) {
    disc(ctx, BONE, hipX - i * (pw * 0.045), spineY - i * rise, boneW * 0.7);
  }
  // ribs hanging from the spine
  for (let i = 1; i < 7; i++) {
    const rx2 = hipX - i * (pw * 0.045);
    r(ctx, BONE, rx2, spineY - i * rise + 4, 5, room.h * 0.12 + i * 4);
  }
  // tail: long, descending behind
  for (let i = 1; i < 10; i++) {
    disc(ctx, BONE, hipX + boneW + i * (pw * 0.042), spineY + i * (room.h * 0.026), Math.max(3, boneW * 0.7 - i));
  }
  // skull: big head with jaw + teeth + eye
  const skx = hipX - 8 * (pw * 0.045);
  const sky = spineY - 8 * rise - room.h * 0.1;
  const skw = room.h * 0.16;
  r(ctx, BONE, skx - skw * 0.7, sky, skw, skw * 0.55);
  r(ctx, BONE, skx - skw * 0.62, sky + skw * 0.55, skw * 0.82, skw * 0.26); // jaw
  for (let t = 0; t < 6; t++) r(ctx, BONE, skx - skw * 0.58 + t * skw * 0.14, sky + skw * 0.48, 4, skw * 0.18); // teeth
  r(ctx, '#14181d', skx - skw * 0.06, sky + skw * 0.14, skw * 0.16, skw * 0.16); // eye socket
  // pterosaur skeleton wheeling overhead on wires
  const ptx = px + pw * 0.82;
  const pty = room.y + room.h * 0.18;
  r(ctx, pal.trim, ptx + 6, room.y, 2, pty - room.y); // wire
  r(ctx, BONE, ptx - 30, pty, 72, 5); // wingspan
  r(ctx, BONE, ptx - 42, pty - 6, 14, 5); // head crest
  r(ctx, BONE, ptx - 34, pty - 2, 18, 4); // beak
  r(ctx, BONE, ptx - 14, pty + 5, 5, 14); // body
  r(ctx, BONE, ptx + 24, pty - 8, 5, 10); // wing tip up
  r(ctx, BONE, ptx - 26, pty + 4, 5, 10); // wing tip down
  // rope stanchions
  for (const sx of [px + 10, px + pw - 20]) {
    r(ctx, '#f5c542', sx, room.floor - 54, 6, 54);
    disc(ctx, '#f5c542', sx + 3, room.floor - 56, 5);
  }
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 10; i++) {
    const t = i / 10;
    r(ctx, '#e8342a', px + 16 + t * (pw - 40), room.floor - 50 + Math.sin(t * Math.PI) * 8, 8, 3); // drooping rope
  }
  ctx.globalAlpha = 1;
  // info plaque
  r(ctx, pal.trim, room.x + room.w - 60, room.floor - 44, 40, 26);
  r(ctx, '#f2ecd8', room.x + room.w - 56, room.floor - 40, 32, 18);
  sh(ctx, room.x + room.w - 52, room.floor - 36, 24, 2, 0.4);
  sh(ctx, room.x + room.w - 52, room.floor - 30, 18, 2, 0.4);
};

export const arcadeP: Painter = (ctx, room, pal, rng) => {
  // patterned carpet
  r(ctx, '#2a1e4a', room.x, room.floor - 10, room.w, 10);
  for (let i = 0; i < Math.floor(room.w / 24); i++) {
    r(ctx, ['#38e1ff', '#ff8fdc', '#ffd166'][rng.int(0, 2)], room.x + 6 + i * 24, room.floor - 8 + (i % 2) * 3, 5, 3);
  }
  // claw machine
  const cx = room.x + 14;
  shadow(ctx, cx, room.floor, 62);
  r(ctx, '#e8342a', cx, room.floor - 118, 62, 118);
  r(ctx, '#bfe3f0', cx + 6, room.floor - 106, 50, 62); // glass
  hl(ctx, cx + 8, room.floor - 104, 8, 58, 0.4);
  fx(ctx, { kind: 'sparkle', x: cx + 6, y: room.floor - 106, w: 50, h: 62, color: '#ffffff', n: 4, speed: 0.8 });
  for (let i = 0; i < 4; i++) {
    disc(ctx, ['#ff8fdc', '#7fc95c', '#ffd166', '#38e1ff'][i], cx + 14 + i * 11, room.floor - 52, 6); // plushies
  }
  r(ctx, pal.trim, cx + 28, room.floor - 106, 2, 26); // claw cable
  r(ctx, pal.trim, cx + 24, room.floor - 80, 10, 6); // claw
  r(ctx, '#ffd166', cx + 22, room.floor - 36, 18, 8); // prize chute
  // skee-ball lane
  const sx = room.x + room.w * 0.42;
  r(ctx, '#c9762e', sx, room.floor - 20, 90, 8); // lane flat
  for (let i = 0; i < 5; i++) r(ctx, '#c9762e', sx + 50 + i * 8, room.floor - 24 - i * 5, 10, 6); // ramp
  r(ctx, '#14181d', sx + 84, room.floor - 66, 34, 44); // target board
  ring(ctx, '#ffd166', sx + 101, room.floor - 50, 10, 2);
  ring(ctx, '#ff8fdc', sx + 101, room.floor - 50, 5, 2);
  disc(ctx, '#eef2f5', sx + 20, room.floor - 24, 5); // ball
  // ticket counter with prizes
  const tx = room.x + room.w - 96;
  r(ctx, pal.furniture, tx, room.floor - 54, 80, 10);
  r(ctx, pal.furnitureDark, tx, room.floor - 44, 80, 44);
  shelf(ctx, pal, tx - 4, room.y + 20, 84, 1, rng);
  // ticket stream
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 6; i++) r(ctx, '#ffd166', tx + 20 + i * 6, room.floor - 40 + (i % 2) * 4, 6, 4);
  ctx.globalAlpha = 1;
  halo(ctx, '#ff8fdc', room.x + room.w * 0.4, room.y + 6, room.w * 0.3, 10, 0.2); // neon wash
};

export const aquariumP: Painter = (ctx, room, pal, rng) => {
  // giant tank: frame + water
  const tx = room.x + 10;
  const tw = room.w - 20;
  const ty = room.y + 16;
  const th = room.h - 60;
  r(ctx, pal.trim, tx - 4, ty - 4, tw + 8, th + 8);
  r(ctx, '#0e3a52', tx, ty, tw, th);
  r(ctx, '#1e5a7a', tx, ty, tw, th * 0.6);
  hl(ctx, tx + 8, ty + 6, tw * 0.3, 4, 0.25); // surface shimmer
  // coral + seaweed
  for (let cxx = tx + 16; cxx < tx + tw - 20; cxx += rng.int(50, 90)) {
    const ch = rng.int(16, 34);
    r(ctx, ['#ff8fdc', '#ff9d4d', '#7fc95c'][rng.int(0, 2)], cxx, ty + th - ch, 8, ch);
    r(ctx, ['#ff8fdc', '#ff9d4d'][rng.int(0, 1)], cxx - 6, ty + th - ch + 8, 6, 8);
  }
  r(ctx, '#e8d59a', tx, ty + th - 8, tw, 8); // sand
  // fish school
  for (let i = 0; i < Math.floor(tw / 40); i++) {
    const fx = tx + rng.int(14, tw - 26);
    const fy = ty + rng.int(14, th - 30);
    const fc = ['#ffd166', '#ff8fdc', '#38e1ff', '#ff9d4d'][rng.int(0, 3)];
    r(ctx, fc, fx, fy, 12, 7);
    r(ctx, fc, fx - 5, fy + 1, 5, 5); // tail
    r(ctx, '#14181d', fx + 8, fy + 2, 2, 2); // eye
  }
  // the shark
  const shx = tx + tw * 0.55;
  const shy = ty + th * 0.35;
  r(ctx, '#8a99a8', shx, shy, 70, 18);
  r(ctx, '#8a99a8', shx - 14, shy + 4, 14, 10); // tail
  r(ctx, '#8a99a8', shx + 24, shy - 10, 12, 10); // dorsal fin
  r(ctx, '#eef2f5', shx + 6, shy + 12, 58, 6); // belly
  r(ctx, '#14181d', shx + 58, shy + 4, 3, 3); // eye
  for (let t = 0; t < 3; t++) r(ctx, '#eef2f5', shx + 44 + t * 6, shy + 14, 3, 4); // teeth
  // bubbles
  for (let i = 0; i < 8; i++) {
    ring(ctx, 'rgba(255,255,255,0.5)', tx + rng.int(20, tw - 20), ty + rng.int(10, th - 16), rng.int(2, 4), 1);
  }
  // live school + rising bubbles + surface shimmer
  fx(ctx, {
    kind: 'swim', x: tx + 8, y: ty + 10, w: tw - 16, h: th - 26,
    color: '#ffd166', colors: ['#ffd166', '#ff8fdc', '#38e1ff', '#ff9d4d'],
    n: Math.max(3, Math.floor(tw / 130)),
  });
  fx(ctx, { kind: 'bubble', x: tx + tw * 0.28, y: ty + 8, w: 14, h: th - 20, color: '#dff3ff', n: 3, speed: 0.8 });
  fx(ctx, { kind: 'shimmer', x: tx + 4, y: ty + 4, w: tw - 8, h: 6, color: '#bfe9f5', n: 2 });
  // viewing bench
  r(ctx, pal.furniture, room.x + room.w * 0.3, room.floor - 24, room.w * 0.4, 8);
  r(ctx, pal.furnitureDark, room.x + room.w * 0.32, room.floor - 16, 8, 16);
  r(ctx, pal.furnitureDark, room.x + room.w * 0.66, room.floor - 16, 8, 16);
};

export const petstoreP: Painter = (ctx, room, pal) => {
  // kennel wall: 2x2 windows with animal faces
  const kx = room.x + 12;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const wx = kx + col * 62;
      const wy = room.y + 26 + row * 58;
      r(ctx, pal.trim, wx - 3, wy - 3, 58, 54);
      r(ctx, '#1c2733', wx, wy, 52, 48);
      const isDog = (row + col) % 2 === 0;
      const fc = isDog ? '#a8763e' : '#8a99a8';
      disc(ctx, fc, wx + 26, wy + 26, 13); // head
      if (isDog) {
        r(ctx, fc, wx + 10, wy + 12, 8, 14); // floppy ears
        r(ctx, fc, wx + 34, wy + 12, 8, 14);
      } else {
        r(ctx, fc, wx + 12, wy + 8, 8, 10); // pointy ears
        r(ctx, fc, wx + 32, wy + 8, 8, 10);
      }
      r(ctx, '#14181d', wx + 20, wy + 22, 3, 3); // eyes
      r(ctx, '#14181d', wx + 30, wy + 22, 3, 3);
      disc(ctx, '#14181d', wx + 26, wy + 30, 2); // nose
      ctx.globalAlpha = 0.5;
      for (let b = 0; b < 4; b++) r(ctx, pal.trim, wx + 6 + b * 12, wy, 2, 48); // bars
      ctx.globalAlpha = 1;
    }
  }
  // fish tank on a stand + bird cage
  const ftx = room.x + room.w - 110;
  r(ctx, pal.furniture, ftx, room.floor - 40, 60, 40);
  r(ctx, '#1e5a7a', ftx + 4, room.floor - 74, 52, 34);
  r(ctx, '#ffd166', ftx + 14, room.floor - 62, 10, 6); // fish
  r(ctx, '#38e1ff', ftx + 34, room.floor - 56, 10, 6);
  hl(ctx, ftx + 8, room.floor - 72, 6, 30, 0.3);
  const bcx = room.x + room.w - 34;
  r(ctx, pal.trim, bcx + 8, room.y + 10, 3, 12);
  r(ctx, pal.trim, bcx - 2, room.y + 22, 24, 34); // cage
  ctx.globalAlpha = 0.5;
  for (let b = 0; b < 4; b++) r(ctx, '#0d1117', bcx + 2 + b * 5, room.y + 24, 2, 30);
  ctx.globalAlpha = 1;
  disc(ctx, '#7fc95c', bcx + 10, room.y + 40, 6); // bird
  r(ctx, '#ffd166', bcx + 15, room.y + 39, 5, 3); // beak
  // food bags + paw prints
  for (let i = 0; i < 3; i++) {
    r(ctx, ['#e86a5a', '#7fc95c', '#ffd166'][i], room.x + room.w * 0.52 + i * 22, room.floor - 34 + i * 4, 20, 34 - i * 4);
  }
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 5; i++) disc(ctx, '#14181d', room.x + 30 + i * 40, room.floor - 5, 3);
  ctx.globalAlpha = 1;
};

export const dojoP: Painter = (ctx, room, pal) => {
  // tatami mat floor
  r(ctx, '#d8c992', room.x, room.floor - 14, room.w, 14);
  ctx.globalAlpha = 0.3;
  for (let mx = room.x + 50; mx < room.x + room.w - 10; mx += 50) r(ctx, '#8a7a4a', mx, room.floor - 12, 3, 12);
  ctx.globalAlpha = 1;
  r(ctx, '#e8342a', room.x + room.w * 0.3, room.floor - 14, room.w * 0.4, 3); // sparring line
  // belt rack: the whole rainbow
  const belts = ['#eef2f5', '#ffd166', '#7fc95c', '#3a8fd4', '#e8342a', '#14181d'];
  const brx = room.x + 16;
  r(ctx, pal.furniture, brx - 4, room.y + 24, belts.length * 18 + 8, 6);
  belts.forEach((b, i) => {
    r(ctx, b, brx + i * 18, room.y + 30, 10, 36);
    r(ctx, b, brx + i * 18 - 2, room.y + 46, 14, 5); // knot
  });
  // wall scroll
  const wx = room.x + room.w * 0.48;
  r(ctx, pal.trim, wx - 3, room.y + 18, 30, 5);
  r(ctx, '#f2ecd8', wx, room.y + 23, 24, 64);
  sh(ctx, wx + 6, room.y + 32, 12, 8, 0.5);
  sh(ctx, wx + 6, room.y + 48, 12, 8, 0.5);
  sh(ctx, wx + 6, room.y + 64, 12, 8, 0.5);
  // punching bag
  const pbx = room.x + room.w - 70;
  r(ctx, pal.trim, pbx + 12, room.y, 4, 22);
  r(ctx, '#e8342a', pbx, room.y + 22, 28, 74);
  hl(ctx, pbx + 3, room.y + 26, 6, 66, 0.2);
  r(ctx, '#14181d', pbx, room.y + 52, 28, 8); // strap
  // kick pads + trophy
  r(ctx, '#3a8fd4', room.x + room.w * 0.62, room.floor - 30, 14, 30);
  r(ctx, '#e86a5a', room.x + room.w * 0.62 + 18, room.floor - 26, 14, 26);
  r(ctx, '#f5c542', room.x + room.w * 0.36, room.floor - 34, 14, 12); // trophy
  r(ctx, '#f5c542', room.x + room.w * 0.36 + 4, room.floor - 22, 6, 8);
};

export const skateparkP: Painter = (ctx, room, pal) => {
  const CONCRETE = '#9a958c';
  // big graffiti mural across the back wall
  ctx.globalAlpha = 0.85;
  const mural = [pal.accent, '#ff8fdc', '#ffd166', '#38e1ff'];
  const mw2 = room.w * 0.5;
  const mx2 = room.x + room.w * 0.25;
  for (let i = 0; i < Math.floor(mw2 / 30); i++) {
    const bh2 = 16 + ((i * 37) % 3) * 12;
    r(ctx, mural[i % mural.length], mx2 + i * 30, room.y + 40 + ((i * 23) % 2) * 14, 26, bh2);
  }
  ctx.globalAlpha = 1;
  hl(ctx, mx2, room.y + 36, mw2, 4, 0.2);
  sh(ctx, mx2 + 10, room.y + 96, mw2 - 20, 6, 0.15); // drip shadow
  // halfpipe: two quarter curves scaled to the room + deck platforms
  const hw = room.w - 40;
  const hx = room.x + 20;
  const steps = 14;
  const pipeH = room.h * 0.36;
  const runL = Math.min(130, room.w * 0.16);
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const h = Math.round(pipeH * t * t); // quarter-pipe curve
    const segW = runL / steps + 1;
    r(ctx, CONCRETE, hx + (steps - 1 - i) * (runL / steps), room.floor - 8 - h, segW + 1, 8 + h);
    r(ctx, CONCRETE, hx + hw - (steps - i) * (runL / steps), room.floor - 8 - h, segW + 1, 8 + h);
  }
  r(ctx, CONCRETE, hx + runL, room.floor - 8, hw - runL * 2, 8); // flat
  for (const [cx2, dir] of [[hx, 1], [hx + hw, -1]] as const) {
    r(ctx, pal.trim, cx2 - (dir > 0 ? 8 : 2), room.floor - 8 - pipeH, 10, 4); // coping
    r(ctx, CONCRETE, cx2 - (dir > 0 ? 16 : 30), room.floor - 8 - pipeH, 46, 8); // deck
    r(ctx, pal.trim, cx2 - (dir > 0 ? 14 : 26), room.floor - 8 - pipeH - 26, 4, 26); // rail posts
    r(ctx, pal.trim, cx2 - (dir > 0 ? 14 : 26), room.floor - 8 - pipeH - 26, 40 * dir, 4);
  }
  hl(ctx, hx + 14, room.floor - 8 - pipeH * 0.45, 18, 3, 0.2); // wax sheen
  // fun box with grind rail in the middle
  const fbx = room.x + room.w * 0.44;
  const fbw = Math.min(150, room.w * 0.18);
  r(ctx, CONCRETE, fbx, room.floor - 30, fbw, 22);
  r(ctx, CONCRETE, fbx - 20, room.floor - 14, fbw + 40, 6);
  r(ctx, pal.trim, fbx + 8, room.floor - 34, fbw - 16, 4); // rail on top
  hl(ctx, fbx, room.floor - 30, fbw, 3, 0.2);
  // skateboard + helmet
  const sbx = room.x + room.w * 0.3;
  r(ctx, '#e8342a', sbx, room.floor - 14, 34, 5);
  disc(ctx, '#14181d', sbx + 7, room.floor - 6, 4);
  disc(ctx, '#14181d', sbx + 27, room.floor - 6, 4);
  disc(ctx, '#3a8fd4', room.x + room.w * 0.68, room.floor - 12, 8); // helmet
  r(ctx, '#3a8fd4', room.x + room.w * 0.68 - 8, room.floor - 12, 16, 6);
  // caution sign
  r(ctx, '#ffd166', room.x + 10, room.y + 30, 26, 22);
  r(ctx, '#14181d', room.x + 20, room.y + 34, 6, 10);
  r(ctx, '#14181d', room.x + 20, room.y + 46, 6, 3);
};
