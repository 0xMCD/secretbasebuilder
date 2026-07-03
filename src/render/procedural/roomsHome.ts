/**
 * Painters: home & living rooms (256 art px per cell).
 * bedroom · kitchen · hallway · bathroom · storage · living · dining · chill ·
 * buffet · library · greenhouse
 */
import {
  barrel, bed, ceilingLamp, couch, crate, disc, halo, hl, plant, poster, r,
  ring, rug, sconce, sh, shadow, shelf, table, type Painter,
} from './kit';

export const bedroomP: Painter = (ctx, room, pal, rng, _def, theme) => {
  ceilingLamp(ctx, pal, theme, room.x + room.w * 0.58, room.y);
  rug(ctx, pal, room.x + room.w * 0.28, room.floor, room.w * 0.5);
  bed(ctx, pal, theme, room.x + 14, room.floor, Math.min(150, room.w * 0.48));
  // nightstand + lamp
  const nx = room.x + Math.min(150, room.w * 0.48) + 26;
  table(ctx, pal, nx, room.floor, 40);
  r(ctx, pal.glow, nx + 12, room.floor - 60, 16, 14); // lamp shade
  r(ctx, pal.trim, nx + 18, room.floor - 48, 4, 8);
  halo(ctx, pal.glow, nx, room.floor - 68, 40, 24);
  poster(ctx, pal, room.x + room.w - 120, room.y + 26, 48, 36);
  if (room.w > 420) {
    // dresser with drawers + round mirror
    const dx = room.x + room.w - 190;
    shadow(ctx, dx, room.floor, 80);
    r(ctx, pal.furniture, dx, room.floor - 68, 80, 68);
    hl(ctx, dx, room.floor - 68, 80, 4);
    for (let d = 0; d < 3; d++) {
      sh(ctx, dx + 6, room.floor - 56 + d * 18, 68, 2, 0.4);
      r(ctx, pal.trim, dx + 34, room.floor - 62 + d * 18, 12, 4);
    }
    disc(ctx, pal.trim, dx + 40, room.floor - 96, 20);
    disc(ctx, '#bfe3f0', dx + 40, room.floor - 96, 15);
    hl(ctx, dx + 32, room.floor - 104, 6, 12, 0.5);
  }
  if (room.w > 620) shelf(ctx, pal, room.x + room.w * 0.5, room.y + 32, 110, 1, rng);
  r(ctx, pal.accent, room.x + 34, room.floor - 6, 10, 6); // slippers
  r(ctx, pal.accent, room.x + 48, room.floor - 6, 10, 6);
};

export const kitchenP: Painter = (ctx, room, pal, rng) => {
  // backsplash tiles
  ctx.globalAlpha = 0.2;
  for (let tx = room.x + 8; tx < room.x + room.w - 8; tx += 20) r(ctx, pal.trim, tx, room.floor - 88, 2, 32);
  for (let ty = room.floor - 88; ty < room.floor - 56; ty += 16) r(ctx, pal.trim, room.x + 8, ty, room.w - 16, 2);
  ctx.globalAlpha = 1;
  // counter + cabinet doors
  r(ctx, pal.furniture, room.x + 8, room.floor - 56, room.w - 16, 12);
  hl(ctx, room.x + 8, room.floor - 56, room.w - 16, 4);
  r(ctx, pal.furnitureDark, room.x + 8, room.floor - 44, room.w - 16, 44);
  for (let cx = room.x + 20; cx < room.x + room.w - 40; cx += 52) {
    sh(ctx, cx + 40, room.floor - 40, 2, 36, 0.35);
    r(ctx, pal.trim, cx + 16, room.floor - 32, 10, 4); // handle
  }
  // stove + hood + steaming pot
  const sx = room.x + room.w * 0.38;
  r(ctx, pal.trim, sx, room.floor - 60, 64, 60);
  hl(ctx, sx, room.floor - 60, 64, 4);
  r(ctx, pal.furnitureDark, sx + 6, room.floor - 56, 22, 6);
  r(ctx, pal.furnitureDark, sx + 36, room.floor - 56, 22, 6);
  r(ctx, pal.glow, sx + 12, room.floor - 36, 40, 20); // oven window
  sh(ctx, sx + 12, room.floor - 26, 40, 10, 0.3);
  r(ctx, pal.furnitureDark, sx + 8, room.y + 16, 48, 24); // hood
  r(ctx, pal.furnitureDark, sx + 24, room.y, 16, 16); // duct
  r(ctx, pal.glow, sx + 8, room.floor - 72, 20, 12); // pot
  r(ctx, pal.furnitureDark, sx + 28, room.floor - 68, 8, 3); // handle
  hl(ctx, sx + 4, room.floor - 88, 6, 12, 0.3); // steam
  hl(ctx, sx + 16, room.floor - 96, 6, 16, 0.22);
  // fridge
  const fx = room.x + room.w - 72;
  shadow(ctx, fx, room.floor, 56);
  r(ctx, pal.trim, fx, room.floor - 104, 56, 104);
  hl(ctx, fx, room.floor - 104, 8, 104);
  sh(ctx, fx + 4, room.floor - 68, 48, 3, 0.4);
  r(ctx, pal.accent, fx + 42, room.floor - 96, 6, 20);
  r(ctx, pal.accent, fx + 42, room.floor - 60, 6, 28);
  r(ctx, pal.glow, fx + 8, room.floor - 96, 14, 10); // magnet drawing
  // upper cabinets + hanging pot rack + jars
  r(ctx, pal.furniture, room.x + 12, room.y + 16, room.w * 0.28, 36);
  sh(ctx, room.x + 12, room.y + 44, room.w * 0.28, 8);
  for (let cx = room.x + 20; cx < room.x + room.w * 0.28; cx += 48) r(ctx, pal.trim, cx, room.y + 30, 8, 4);
  if (room.w > 500) {
    const rx = room.x + room.w * 0.62;
    r(ctx, pal.trim, rx, room.y + 20, 90, 4); // rack bar
    for (let i = 0; i < 3; i++) {
      r(ctx, pal.trim, rx + 10 + i * 30, room.y + 24, 2, 8);
      r(ctx, pal.furnitureDark, rx + 2 + i * 30, room.y + 32, 18, 12); // pots
      hl(ctx, rx + 4 + i * 30, room.y + 34, 4, 8, 0.3);
    }
  }
  for (let j = 0; j < 3; j++) r(ctx, rng.chance(0.5) ? pal.accent : pal.glow, room.x + room.w * 0.3 + 28 + j * 20, room.y + 38, 12, 16); // jars
};

export const hallwayP: Painter = (ctx, room, pal, rng, _def, theme) => {
  // floor runner
  r(ctx, pal.accent, room.x + 12, room.floor - 8, room.w - 24, 8);
  ctx.globalAlpha = 0.35;
  for (let fx = room.x + 24; fx < room.x + room.w - 24; fx += 28) r(ctx, pal.furnitureDark, fx, room.floor - 8, 8, 8);
  ctx.globalAlpha = 1;
  const n = Math.max(1, Math.round(room.w / 180));
  for (let i = 0; i < n; i++) sconce(ctx, pal, theme, room.x + ((i + 0.5) * room.w) / n - 8, room.y + 44);
  // directional sign
  const sx = room.x + room.w * 0.5 - 32;
  r(ctx, pal.furnitureDark, sx, room.y + 88, 64, 24);
  r(ctx, pal.accent, sx + 8, room.y + 96, 24, 8);
  r(ctx, pal.accent, sx + 36, room.y + 94, 8, 12); // arrow head
  r(ctx, pal.trim, room.x, room.floor - 16, room.w, 4); // skirting
  if (rng.chance(0.5)) {
    // small bench
    const bx = room.x + rng.int(20, Math.max(21, room.w - 90));
    shadow(ctx, bx, room.floor, 60);
    r(ctx, pal.furniture, bx, room.floor - 28, 60, 8);
    r(ctx, pal.furnitureDark, bx + 6, room.floor - 20, 6, 20);
    r(ctx, pal.furnitureDark, bx + 48, room.floor - 20, 6, 20);
  }
};

export const bathroomP: Painter = (ctx, room, pal, rng) => {
  // tiled wainscot
  ctx.globalAlpha = 0.18;
  for (let tx = room.x; tx < room.x + room.w; tx += 24) r(ctx, pal.trim, tx, room.floor - 80, 2, 80);
  for (let ty = room.floor - 80; ty < room.floor; ty += 20) r(ctx, pal.trim, room.x, ty, room.w, 2);
  ctx.globalAlpha = 1;
  // toilet
  shadow(ctx, room.x + 16, room.floor, 44);
  r(ctx, '#eef2f5', room.x + 16, room.floor - 52, 12, 36);
  r(ctx, '#eef2f5', room.x + 20, room.floor - 28, 36, 16);
  r(ctx, '#eef2f5', room.x + 24, room.floor - 12, 12, 12);
  sh(ctx, room.x + 20, room.floor - 20, 36, 4, 0.15);
  r(ctx, pal.trim, room.x + 18, room.floor - 56, 8, 4); // flush button
  // pedestal sink + mirror
  const px = room.x + 84;
  r(ctx, '#eef2f5', px, room.floor - 52, 40, 12);
  r(ctx, '#eef2f5', px + 14, room.floor - 40, 12, 40);
  r(ctx, pal.trim, px + 16, room.floor - 58, 8, 6); // tap
  r(ctx, pal.trim, px - 4, room.y + 20, 48, 40); // mirror frame
  r(ctx, '#bfe3f0', px, room.y + 24, 40, 32);
  hl(ctx, px + 4, room.y + 26, 8, 28, 0.5);
  // towel bar
  r(ctx, pal.trim, px + 60, room.y + 52, 44, 4);
  r(ctx, pal.accent, px + 66, room.y + 56, 14, 28);
  r(ctx, pal.glow, px + 84, room.y + 56, 14, 24);
  // tub with duck
  if (room.w > 400) {
    const tx = room.x + room.w - 140;
    shadow(ctx, tx, room.floor, 124);
    r(ctx, '#eef2f5', tx, room.floor - 44, 124, 36);
    hl(ctx, tx, room.floor - 44, 124, 6);
    r(ctx, '#9fd8ea', tx + 8, room.floor - 36, 108, 12);
    hl(ctx, tx + 16, room.floor - 36, 12, 4, 0.5);
    hl(ctx, tx + 40, room.floor - 38, 10, 4, 0.5);
    r(ctx, '#ffd166', tx + 70, room.floor - 42, 12, 8); // duck!
    r(ctx, '#ff9d4d', tx + 82, room.floor - 40, 4, 3);
    r(ctx, pal.trim, tx + 4, room.floor - 8, 10, 8); // feet
    r(ctx, pal.trim, tx + 110, room.floor - 8, 10, 8);
    r(ctx, pal.trim, tx + 12, room.floor - 68, 6, 24); // faucet
  }
  r(ctx, pal.accent, room.x + 68, room.floor - 6, 32, 6); // bathmat
  if (rng.chance(0.6)) plant(ctx, pal, room.x + room.w - 44, room.floor);
};

export const storageP: Painter = (ctx, room, pal, rng) => {
  // bare bulb
  const bx = room.x + room.w / 2;
  r(ctx, pal.trim, bx, room.y, 4, 28);
  r(ctx, pal.glow, bx - 6, room.y + 28, 16, 16);
  halo(ctx, pal.glow, bx - 24, room.y + 24, 52, 40);
  // crate stacks
  let x = room.x + 12;
  while (x < room.x + room.w - 60) {
    const s = rng.int(40, 56);
    crate(ctx, pal, x, room.floor - s, s);
    if (rng.chance(0.6)) crate(ctx, pal, x + rng.int(0, 12), room.floor - s - (s - 8), s - 8);
    x += s + rng.int(8, 24);
  }
  barrel(ctx, pal, room.x + room.w - 52, room.floor);
  if (room.w > 280) shelf(ctx, pal, room.x + 16, room.y + 20, room.w - 32, 1, rng);
  // hanging tools + cobweb corner
  for (let hx = room.x + 28; hx < room.x + room.w - 40; hx += rng.int(60, 100)) {
    if (rng.chance(0.5)) {
      r(ctx, pal.trim, hx, room.y + 72, 4, 8);
      r(ctx, pal.furnitureDark, hx - 4, room.y + 80, 12, 20);
    }
  }
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 4; i++) r(ctx, '#ffffff', room.x + room.w - 20 - i * 7, room.y + 4 + i * 6, 8, 2);
  ctx.globalAlpha = 1;
  for (let fx = 0; fx < 4; fx++) r(ctx, fx % 2 ? pal.glow : pal.furnitureDark, room.x + 4 + fx * 12, room.floor - 4, 12, 4);
};

export const livingP: Painter = (ctx, room, pal, rng, _def, theme) => {
  ceilingLamp(ctx, pal, theme, room.x + room.w * 0.3, room.y);
  rug(ctx, pal, room.x + room.w * 0.2, room.floor, room.w * 0.55);
  couch(ctx, pal, theme, room.x + room.w * 0.22, room.floor, Math.min(170, room.w * 0.36));
  const tx = room.x + room.w * 0.22 + Math.min(170, room.w * 0.36) + 20;
  table(ctx, pal, tx, room.floor, 52);
  r(ctx, pal.glow, tx + 8, room.floor - 48, 10, 8); // mugs
  r(ctx, pal.accent, tx + 24, room.floor - 48, 10, 8);
  if (room.w > 520) {
    // fireplace with mantle
    const fx = room.x + room.w - 140;
    r(ctx, pal.furnitureDark, fx, room.floor - 88, 96, 88);
    r(ctx, pal.trim, fx - 6, room.floor - 96, 108, 12);
    r(ctx, '#1a1410', fx + 20, room.floor - 64, 56, 64);
    r(ctx, '#ff9d4d', fx + 30, room.floor - 32, 36, 24);
    r(ctx, '#ffd166', fx + 40, room.floor - 40, 16, 16);
    halo(ctx, '#ff9d4d', fx + 12, room.floor - 56, 72, 56, 0.2);
    r(ctx, pal.furnitureDark, fx + 26, room.floor - 8, 44, 4); // logs
    r(ctx, pal.accent, fx + 10, room.floor - 112, 20, 16); // mantle trinkets
    r(ctx, pal.glow, fx + 60, room.floor - 108, 16, 12);
  } else {
    const lx = room.x + room.w - 52;
    r(ctx, pal.trim, lx + 8, room.floor - 80, 6, 80);
    r(ctx, pal.glow, lx, room.floor - 100, 24, 20);
    halo(ctx, pal.glow, lx - 12, room.floor - 108, 48, 36);
  }
  shelf(ctx, pal, room.x + 16, room.y + 28, 96, Math.max(1, Math.floor((room.h - 80) / 44)), rng);
  plant(ctx, pal, room.x + room.w * 0.62, room.floor);
  poster(ctx, pal, room.x + room.w * 0.44, room.y + 24, 40, 32);
  // sleeping cat on the rug
  const cx = room.x + room.w * 0.45;
  disc(ctx, pal.furnitureDark, cx, room.floor - 10, 10);
  disc(ctx, pal.furnitureDark, cx + 12, room.floor - 12, 6);
  r(ctx, pal.furnitureDark, cx + 15, room.floor - 20, 3, 5); // ears
  r(ctx, pal.furnitureDark, cx + 10, room.floor - 20, 3, 5);
  r(ctx, pal.furnitureDark, cx - 16, room.floor - 8, 10, 3); // tail
};

export const diningP: Painter = (ctx, room, pal, rng, _def, theme) => {
  ceilingLamp(ctx, pal, theme, room.x + room.w * 0.5, room.y);
  rug(ctx, pal, room.x + room.w * 0.12, room.floor, room.w * 0.76);
  // long table
  const tx = room.x + room.w * 0.16;
  const tw = room.w * 0.68;
  shadow(ctx, tx, room.floor, tw);
  r(ctx, pal.furniture, tx, room.floor - 44, tw, 10);
  hl(ctx, tx, room.floor - 44, tw, 3);
  r(ctx, pal.furnitureDark, tx + 10, room.floor - 34, 8, 34);
  r(ctx, pal.furnitureDark, tx + tw - 18, room.floor - 34, 8, 34);
  // chairs: backs visible behind the table
  for (let cx = tx + 16; cx < tx + tw - 30; cx += 56) {
    r(ctx, pal.furnitureDark, cx, room.floor - 72, 26, 28);
    hl(ctx, cx, room.floor - 72, 26, 3);
    r(ctx, pal.furnitureDark, cx + 2, room.floor - 44, 4, 44);
  }
  // place settings + centerpiece candles
  for (let px = tx + 22; px < tx + tw - 24; px += 56) {
    disc(ctx, pal.glow, px + 10, room.floor - 46, 7); // plate
    r(ctx, pal.trim, px + 22, room.floor - 50, 2, 8); // fork
  }
  const mid = tx + tw / 2;
  r(ctx, pal.trim, mid - 14, room.floor - 52, 28, 6); // candelabra base
  for (let i = 0; i < 3; i++) {
    r(ctx, pal.glow, mid - 10 + i * 9, room.floor - 62, 3, 10);
    r(ctx, '#ffd166', mid - 10 + i * 9, room.floor - 66, 3, 4);
    halo(ctx, '#ffd166', mid - 13 + i * 9, room.floor - 70, 9, 10, 0.25);
  }
  // sideboard with dishes
  if (room.w > 420) {
    const sx = room.x + room.w - 84;
    shadow(ctx, sx, room.floor, 68);
    r(ctx, pal.furniture, sx, room.floor - 56, 68, 56);
    hl(ctx, sx, room.floor - 56, 68, 4);
    sh(ctx, sx + 32, room.floor - 50, 2, 44, 0.35);
    disc(ctx, pal.glow, sx + 16, room.floor - 64, 7);
    disc(ctx, pal.accent, sx + 40, room.floor - 64, 7);
  }
  if (rng.chance(0.6)) poster(ctx, pal, room.x + 24, room.y + 28, 36, 28);
};

export const chillP: Painter = (ctx, room, pal, rng) => {
  rug(ctx, pal, room.x + 16, room.floor, room.w - 32);
  // bean bags
  for (let i = 0; i < (room.w > 400 ? 3 : 2); i++) {
    const bx = room.x + 24 + i * (room.w * 0.3);
    shadow(ctx, bx, room.floor, 60);
    disc(ctx, i % 2 ? pal.accent : pal.glow, bx + 30, room.floor - 22, 30);
    r(ctx, i % 2 ? pal.accent : pal.glow, bx + 4, room.floor - 22, 52, 22);
    hl(ctx, bx + 12, room.floor - 38, 20, 6, 0.25);
  }
  // lava lamp
  const lx = room.x + room.w - 48;
  shadow(ctx, lx, room.floor, 28);
  r(ctx, pal.furnitureDark, lx + 4, room.floor - 8, 20, 8);
  r(ctx, '#4a2a5c', lx + 6, room.floor - 60, 16, 52);
  r(ctx, '#ff8fdc', lx + 9, room.floor - 34, 10, 12); // blob
  r(ctx, '#ff8fdc', lx + 11, room.floor - 52, 7, 8);
  halo(ctx, '#ff8fdc', lx - 4, room.floor - 64, 36, 60, 0.18);
  r(ctx, pal.furnitureDark, lx + 8, room.floor - 68, 12, 8);
  // low table with headphones
  const tx2 = room.x + room.w * 0.42;
  r(ctx, pal.furniture, tx2, room.floor - 22, 60, 6);
  r(ctx, pal.furnitureDark, tx2 + 6, room.floor - 16, 6, 16);
  r(ctx, pal.furnitureDark, tx2 + 48, room.floor - 16, 6, 16);
  ring(ctx, pal.trim, tx2 + 30, room.floor - 34, 10, 3); // headphones band
  r(ctx, pal.accent, tx2 + 20, room.floor - 32, 6, 10);
  r(ctx, pal.accent, tx2 + 34, room.floor - 32, 6, 10);
  // floor cushions
  r(ctx, pal.glow, room.x + room.w * 0.3, room.floor - 10, 34, 10);
  hl(ctx, room.x + room.w * 0.3, room.floor - 10, 34, 3);
  if (rng.chance(0.7)) poster(ctx, pal, room.x + room.w * 0.35, room.y + 30, 40, 28);
};

export const buffetP: Painter = (ctx, room, pal, rng) => {
  // long counter with sneeze guard
  const bx = room.x + 16;
  const bw = room.w - 96;
  shadow(ctx, bx, room.floor, bw);
  r(ctx, pal.furniture, bx, room.floor - 52, bw, 10);
  r(ctx, pal.furnitureDark, bx, room.floor - 42, bw, 42);
  hl(ctx, bx, room.floor - 52, bw, 3);
  // glass guard
  hl(ctx, bx + 4, room.floor - 84, bw - 8, 26, 0.12);
  r(ctx, pal.trim, bx + 2, room.floor - 86, 4, 34);
  r(ctx, pal.trim, bx + bw - 6, room.floor - 86, 4, 34);
  r(ctx, pal.trim, bx + 2, room.floor - 88, bw - 4, 3);
  // food trays with steam
  const foods = ['#e8b04a', '#7fc95c', '#e86a5a', '#f2ecd8', '#ff8fdc', '#c9762e'];
  let fx = bx + 10;
  let fi = 0;
  while (fx < bx + bw - 34) {
    r(ctx, '#c9ced4', fx, room.floor - 62, 30, 10); // tray
    r(ctx, foods[fi % foods.length], fx + 3, room.floor - 68, 24, 8); // food
    if (fi % 2 === 0) hl(ctx, fx + 10, room.floor - 78, 4, 8, 0.25); // steam
    fx += 38;
    fi++;
  }
  // heat lamps
  for (let hx = bx + 30; hx < bx + bw - 20; hx += 90) {
    r(ctx, pal.trim, hx, room.y + 14, 4, 14);
    r(ctx, '#ff5555', hx - 8, room.y + 28, 20, 8);
    halo(ctx, '#ff9d4d', hx - 14, room.y + 36, 32, 22, 0.2);
  }
  // dessert tier + plate stack
  const dx = room.x + room.w - 66;
  shadow(ctx, dx, room.floor, 48);
  disc(ctx, pal.trim, dx + 24, room.floor - 22, 22);
  disc(ctx, pal.trim, dx + 24, room.floor - 40, 15);
  disc(ctx, pal.trim, dx + 24, room.floor - 54, 9);
  for (let i = 0; i < 5; i++) {
    r(ctx, ['#ff8fdc', '#ffd166', '#7fc95c'][rng.int(0, 2)], dx + 10 + rng.int(0, 24), room.floor - 60 + rng.int(0, 36), 6, 5); // treats
  }
  for (let i = 0; i < 4; i++) r(ctx, '#eef2f5', bx - 2, room.floor - 12 - i * 5, 22, 4); // plate stack
};

export const libraryP: Painter = (ctx, room, pal, rng, _def, theme) => {
  const shelfW = room.w * 0.55;
  const rows = Math.max(2, Math.floor((room.h - 32) / 44));
  r(ctx, pal.furniture, room.x + 8, room.y + 16, 8, room.h - 24);
  r(ctx, pal.furniture, room.x + 8 + shelfW, room.y + 16, 8, room.h - 24);
  shelf(ctx, pal, room.x + 16, room.y + 24, shelfW - 8, rows, rng);
  // rolling ladder
  const lx = room.x + shelfW * 0.6;
  r(ctx, pal.trim, lx, room.y + 24, 6, room.h - 44);
  r(ctx, pal.trim, lx + 28, room.y + 24, 6, room.h - 44);
  for (let y = room.y + 36; y < room.floor - 16; y += 28) r(ctx, pal.furniture, lx, y, 34, 6);
  disc(ctx, pal.furnitureDark, lx + 3, room.floor - 6, 6);
  disc(ctx, pal.furnitureDark, lx + 31, room.floor - 6, 6);
  // reading nook
  const ax = room.x + room.w - 150;
  couch(ctx, pal, theme, ax, room.floor, 84);
  const tx = ax + 94;
  table(ctx, pal, tx, room.floor, 36);
  r(ctx, '#f2ecd8', tx + 6, room.floor - 48, 24, 8); // open book
  r(ctx, pal.furnitureDark, tx + 16, room.floor - 48, 3, 8);
  r(ctx, pal.trim, ax + 100, room.floor - 104, 6, 56); // floor lamp
  r(ctx, pal.glow, ax + 90, room.floor - 120, 26, 18);
  halo(ctx, pal.glow, ax + 76, room.floor - 128, 56, 36);
  // globe + floor book stack
  disc(ctx, pal.accent, room.x + shelfW + 40, room.floor - 44, 13);
  hl(ctx, room.x + shelfW + 36, room.floor - 50, 8, 8, 0.4);
  r(ctx, pal.furnitureDark, room.x + shelfW + 36, room.floor - 30, 8, 30);
  for (let i = 0; i < 3; i++) r(ctx, [pal.accent, pal.glow, pal.trim][i], room.x + shelfW + 60, room.floor - 8 - i * 7, 30 - i * 4, 6);
  rug(ctx, pal, room.x + shelfW + 16, room.floor, room.w * 0.3);
};

export const greenhouseP: Painter = (ctx, room, pal, rng) => {
  // grow lamps with light cones
  for (let x = room.x + 32; x < room.x + room.w - 48; x += 104) {
    r(ctx, pal.trim, x, room.y + 8, 72, 10);
    r(ctx, pal.glow, x + 8, room.y + 18, 56, 6);
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = pal.glow;
    ctx.fillRect(x + 4, room.y + 24, 64, room.h - 48);
    ctx.globalAlpha = 1;
  }
  // raised beds with crops
  let px = room.x + 20;
  while (px < room.x + room.w - 68) {
    const bw = rng.int(52, 76);
    shadow(ctx, px, room.floor, bw);
    r(ctx, pal.furnitureDark, px, room.floor - 32, bw, 32);
    hl(ctx, px, room.floor - 32, bw, 4);
    sh(ctx, px + 4, room.floor - 28, bw - 8, 8, 0.35);
    const stems = rng.int(2, 4);
    for (let s = 0; s < stems; s++) {
      const sx = px + 8 + s * (bw / stems);
      const ph = rng.int(28, Math.min(104, room.h - 80));
      r(ctx, pal.accent, sx, room.floor - 32 - ph, 6, ph);
      r(ctx, pal.accent, sx - 8, room.floor - 32 - ph + 12, 10, 8);
      r(ctx, pal.accent, sx + 6, room.floor - 32 - ph + 24, 10, 8);
      r(ctx, pal.glow, sx - 2, room.floor - 40 - ph, 10, 10);
      if (rng.chance(0.5)) disc(ctx, '#ff6b5e', sx + 10, room.floor - 32 - ph * 0.5, 5); // tomato
    }
    px += bw + rng.int(12, 28);
  }
  // vines + butterfly
  for (let x = room.x + 40; x < room.x + room.w - 24; x += rng.int(68, 112)) {
    const vh = rng.int(36, Math.min(112, room.h * 0.42));
    r(ctx, pal.accent, x, room.y + 20, 6, vh);
    r(ctx, pal.accent, x - 6, room.y + 20 + vh * 0.4, 8, 8);
    r(ctx, pal.glow, x - 2, room.y + 20 + vh, 12, 10);
  }
  const bx = room.x + room.w * 0.5;
  r(ctx, '#ffd166', bx, room.y + room.h * 0.4, 5, 5);
  r(ctx, '#ffd166', bx + 6, room.y + room.h * 0.4 - 2, 5, 5);
  // water tank + drip line
  const tx = room.x + room.w - 60;
  r(ctx, pal.furnitureDark, tx, room.floor - 84, 44, 84);
  hl(ctx, tx, room.floor - 84, 44, 4);
  r(ctx, '#9fd8ea', tx + 8, room.floor - 72, 28, 44);
  r(ctx, pal.glow, tx + 16, room.floor - 24, 12, 8); // gauge
  r(ctx, pal.trim, room.x + 20, room.y + room.h * 0.55, room.w - 88, 4);
  // watering can
  r(ctx, '#7fd4d4', room.x + 8, room.floor - 18, 22, 18);
  r(ctx, '#7fd4d4', room.x + 28, room.floor - 14, 10, 4);
};
