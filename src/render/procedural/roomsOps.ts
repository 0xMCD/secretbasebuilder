/**
 * Painters: secret-ops & infrastructure rooms (256 art px per cell).
 * lab · command · vault · garage · racegarage · elevator · silo
 */
import {
  disc, halo, hl, r, ring, sh, shadow, shelf, wallScreen, type Painter,
} from './kit';

export const labP: Painter = (ctx, room, pal, rng) => {
  // warning stripe floor edge
  for (let fx = room.x; fx < room.x + room.w - 16; fx += 24) {
    r(ctx, fx % 48 < 24 ? pal.glow : pal.furnitureDark, fx, room.floor - 6, 24, 6);
  }
  // workbench with flasks + bubbles
  const bw = room.w * 0.46;
  r(ctx, pal.trim, room.x + 16, room.floor - 68, bw, 10);
  hl(ctx, room.x + 16, room.floor - 68, bw, 4);
  r(ctx, pal.furnitureDark, room.x + 24, room.floor - 58, 8, 58);
  r(ctx, pal.furnitureDark, room.x + bw - 4, room.floor - 58, 8, 58);
  for (let i = 0; i < 4; i++) {
    const fx = room.x + 36 + i * 44;
    const c = rng.chance(0.5) ? pal.accent : pal.glow;
    r(ctx, c, fx, room.floor - 92, 16, 24);
    r(ctx, pal.trim, fx + 4, room.floor - 100, 8, 8); // neck
    hl(ctx, fx + 2, room.floor - 104, 4, 6, 0.4); // vapor
    if (rng.chance(0.6)) hl(ctx, fx + 6, room.floor - 88, 4, 4, 0.5); // bubble
  }
  // microscope
  const mx = room.x + bw - 30;
  r(ctx, pal.furnitureDark, mx, room.floor - 84, 20, 16);
  r(ctx, pal.trim, mx + 6, room.floor - 92, 8, 10);
  // tall specimen tank
  const tx = room.x + room.w - 104;
  r(ctx, pal.furnitureDark, tx, room.y + 28, 80, room.h - 68);
  hl(ctx, tx, room.y + 28, 80, 4);
  r(ctx, pal.accent, tx + 10, room.y + 44, 60, room.h - 108);
  for (let b = 0; b < 6; b++) hl(ctx, tx + 16 + rng.int(0, 44), room.y + 56 + rng.int(0, room.h - 140), 6, 6, 0.4);
  disc(ctx, pal.glow, tx + 40, room.y + room.h * 0.42, 14); // the specimen??
  r(ctx, pal.glow, tx + 34, room.y + room.h * 0.42 + 12, 12, 16); // ...with a tail
  for (let ry = room.y + 40; ry < room.y + room.h - 60; ry += 40) r(ctx, pal.trim, tx - 4, ry, 4, 8); // rivets
  // wall screen + periodic-ish poster
  wallScreen(ctx, pal, room.x + 24, room.y + 28, room.w * 0.26, 52, rng);
  const px = room.x + room.w * 0.44;
  r(ctx, pal.trim, px - 4, room.y + 24, 80, 56);
  r(ctx, '#e8e2d0', px, room.y + 28, 72, 48);
  for (let gy = 0; gy < 3; gy++)
    for (let gx = 0; gx < 6; gx++)
      if (rng.chance(0.8)) r(ctx, [pal.accent, pal.glow, pal.furniture][rng.int(0, 2)], px + 4 + gx * 12, room.y + 32 + gy * 14, 8, 10);
  // hanging cables + stool
  r(ctx, pal.trim, room.x + room.w * 0.35, room.y, 4, 44);
  r(ctx, pal.furnitureDark, room.x + bw + 40, room.floor - 36, 6, 36);
  r(ctx, pal.furniture, room.x + bw + 28, room.floor - 44, 30, 8);
};

export const commandP: Painter = (ctx, room, pal, rng) => {
  // big world-map screen
  const mw = room.w * 0.4;
  r(ctx, pal.furnitureDark, room.x + 20, room.y + 24, mw + 16, room.h * 0.45 + 16);
  r(ctx, '#0d1826', room.x + 28, room.y + 32, mw, room.h * 0.45);
  for (let i = 0; i < 8; i++) {
    r(ctx, pal.accent, room.x + 36 + rng.int(0, mw - 40), room.y + 40 + rng.int(0, room.h * 0.45 - 24), rng.int(12, 32), rng.int(8, 16));
  }
  disc(ctx, pal.glow, room.x + 28 + rng.int(12, mw - 20), room.y + 40 + rng.int(4, room.h * 0.4), 4); // blip
  ring(ctx, pal.glow, room.x + 28 + mw * 0.6, room.y + 32 + room.h * 0.2, 12, 2); // ping ring
  // radar
  const rx = room.x + room.w * 0.56;
  const rs = Math.min(88, room.h * 0.36);
  r(ctx, pal.furnitureDark, rx - 6, room.y + 24, rs + 12, rs + 12);
  r(ctx, '#0d1a12', rx, room.y + 30, rs, rs);
  ctx.globalAlpha = 0.5;
  ring(ctx, pal.glow, rx + rs / 2, room.y + 30 + rs / 2, rs * 0.38, 2);
  ring(ctx, pal.glow, rx + rs / 2, room.y + 30 + rs / 2, rs * 0.2, 2);
  ctx.globalAlpha = 1;
  r(ctx, pal.glow, rx + rs / 2, room.y + 34, 3, rs / 2 - 4); // sweep
  disc(ctx, pal.accent, rx + rs * 0.7, room.y + 30 + rs * 0.3, 4); // bogey
  // status screens
  for (let sx = rx + rs + 28; sx < room.x + room.w - 80; sx += 92) {
    wallScreen(ctx, pal, sx, room.y + 28, 72, 48, rng);
  }
  // red phone (direct line to HQ)
  const phx = room.x + room.w - 60;
  r(ctx, '#8e2f3c', phx, room.y + 40, 30, 12);
  disc(ctx, '#8e2f3c', phx + 4, room.y + 40, 5);
  disc(ctx, '#8e2f3c', phx + 26, room.y + 40, 5);
  halo(ctx, '#ff5555', phx - 6, room.y + 34, 42, 24, 0.15);
  // console desks with chairs + glowing keyboards
  r(ctx, pal.furniture, room.x + 24, room.floor - 56, room.w - 48, 10);
  hl(ctx, room.x + 24, room.floor - 56, room.w - 48, 4);
  for (let cx = room.x + 40; cx < room.x + room.w - 68; cx += 80) {
    r(ctx, pal.furnitureDark, cx, room.floor - 46, 8, 46);
    r(ctx, pal.accent, cx + 16, room.floor - 52, 32, 5);
    halo(ctx, pal.accent, cx + 12, room.floor - 60, 40, 12, 0.12);
    r(ctx, pal.furnitureDark, cx + 20, room.floor - 30, 24, 26); // chair back
    r(ctx, pal.furniture, cx + 16, room.floor - 10, 32, 5);
    disc(ctx, pal.furnitureDark, cx + 24, room.floor - 4, 4); // casters
    disc(ctx, pal.furnitureDark, cx + 40, room.floor - 4, 4);
  }
  sh(ctx, room.x + 20, room.floor - 4, room.w - 40, 4, 0.3); // cable cover
};

export const vaultP: Painter = (ctx, room, pal, rng) => {
  // massive door: ring, spokes, hub, rim bolts
  const cx = room.x + room.w * 0.3;
  const cy = room.y + room.h * 0.48;
  const rad = Math.min(room.h, room.w) * 0.3;
  disc(ctx, pal.trim, cx, cy, rad);
  hl(ctx, cx - rad, cy - rad, rad * 2, 6);
  disc(ctx, pal.furnitureDark, cx, cy, rad - 12);
  r(ctx, pal.trim, cx - rad * 0.55, cy - 4, rad * 1.1, 8); // spokes
  r(ctx, pal.trim, cx - 4, cy - rad * 0.55, 8, rad * 1.1);
  disc(ctx, pal.accent, cx, cy, 12); // hub
  hl(ctx, cx - 10, cy - 10, 20, 4);
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    disc(ctx, pal.glow, cx + Math.cos(ang) * (rad - 5), cy + Math.sin(ang) * (rad - 5), 3); // rim bolts
  }
  // laser tripwires
  ctx.globalAlpha = 0.4;
  r(ctx, '#ff5555', cx + rad + 12, room.floor - 60, room.w - (cx - room.x) - rad - 30, 2);
  r(ctx, '#ff5555', cx + rad + 30, room.floor - 30, room.w - (cx - room.x) - rad - 48, 2);
  ctx.globalAlpha = 1;
  // security camera
  const camx = room.x + room.w - 40;
  r(ctx, pal.trim, camx + 10, room.y + 12, 4, 10);
  r(ctx, pal.furnitureDark, camx, room.y + 22, 24, 14);
  disc(ctx, '#ff5555', camx + 4, room.y + 29, 3);
  // keypad
  r(ctx, pal.furnitureDark, cx + rad + 16, cy - 20, 24, 40);
  r(ctx, pal.glow, cx + rad + 20, cy - 16, 16, 10);
  halo(ctx, pal.glow, cx + rad + 12, cy - 24, 32, 20);
  for (let ky = 0; ky < 3; ky++)
    for (let kx = 0; kx < 2; kx++) r(ctx, pal.trim, cx + rad + 21 + kx * 8, cy + ky * 8, 5, 5);
  // treasure: gold pyramid + chest with spilling coins
  let gx = room.x + room.w * 0.6;
  for (let row = 0; row < 3; row++) {
    for (let g = 0; g < 3 - row; g++) {
      r(ctx, '#f5c542', gx + g * 28 + row * 14, room.floor - 12 - row * 12, 24, 12);
      hl(ctx, gx + g * 28 + row * 14, room.floor - 12 - row * 12, 24, 4);
    }
  }
  const chx = room.x + room.w - 84;
  shadow(ctx, chx, room.floor, 64);
  r(ctx, pal.furniture, chx, room.floor - 40, 64, 40);
  r(ctx, pal.trim, chx, room.floor - 46, 64, 10);
  r(ctx, pal.glow, chx + 27, room.floor - 30, 12, 14); // lock
  for (let i = 0; i < 4; i++) disc(ctx, '#f5c542', chx + 10 + rng.int(0, 44), room.floor - 50 + rng.int(0, 6), 4); // coins
};

export const garageP: Painter = (ctx, room, pal, rng) => {
  // segmented bay door with window slits
  r(ctx, pal.trim, room.x, room.y + 12, 32, room.h - 16);
  for (let y = room.y + 28; y < room.floor; y += 32) {
    sh(ctx, room.x + 4, y, 24, 4, 0.4);
    if (y < room.y + 80) r(ctx, pal.glow, room.x + 10, y + 10, 12, 8);
  }
  // the utility vehicle
  const vw = Math.min(340, room.w * 0.52);
  const vx = room.x + room.w * 0.2;
  shadow(ctx, vx, room.floor, vw);
  r(ctx, pal.accent, vx + vw * 0.22, room.floor - 92, vw * 0.5, 36); // cabin
  r(ctx, '#bfe3f0', vx + vw * 0.28, room.floor - 84, vw * 0.16, 20); // windshield
  hl(ctx, vx + vw * 0.29, room.floor - 82, 8, 16, 0.5);
  r(ctx, pal.furniture, vx, room.floor - 60, vw, 36); // body
  hl(ctx, vx, room.floor - 60, vw, 6);
  r(ctx, pal.glow, vx + 4, room.floor - 52, 12, 10); // headlight
  halo(ctx, pal.glow, vx - 16, room.floor - 56, 20, 18);
  r(ctx, pal.accent, vx + vw - 12, room.floor - 52, 8, 10); // tail light
  for (const wx of [vx + 32, vx + vw - 68]) {
    disc(ctx, '#14181d', wx + 18, room.floor - 14, 18); // tire
    disc(ctx, pal.trim, wx + 18, room.floor - 14, 8); // hub
  }
  sh(ctx, vx + 16, room.floor - 40, vw - 32, 8, 0.12);
  // workbench + pegboard + toolbox + tire stack
  const wbx = room.x + room.w - 140;
  r(ctx, pal.trim, wbx, room.floor - 60, 96, 8);
  r(ctx, pal.furnitureDark, wbx + 6, room.floor - 52, 8, 52);
  r(ctx, pal.furnitureDark, wbx + 82, room.floor - 52, 8, 52);
  r(ctx, '#e86a5a', wbx + 20, room.floor - 76, 16, 16); // toolbox
  shelf(ctx, pal, wbx - 8, room.y + 24, 104, 1, rng);
  const tsx = room.x + room.w - 184;
  for (let t = 0; t < 3; t++) {
    r(ctx, '#14181d', tsx, room.floor - 16 - t * 16, 36, 16);
    disc(ctx, pal.trim, tsx + 18, room.floor - 8 - t * 16, 6);
  }
  sh(ctx, vx + vw * 0.4, room.floor - 6, 52, 6, 0.25); // oil stain
};

export const racegarageP: Painter = (ctx, room, pal) => {
  // checkered banner along the ceiling
  for (let x = room.x; x < room.x + room.w - 12; x += 16) {
    r(ctx, (x / 16) % 2 < 1 ? '#eef2f5' : '#14181d', x, room.y + 6, 16, 10);
  }
  // the race car: low, sleek, numbered
  const vw = Math.min(360, room.w * 0.55);
  const vx = room.x + room.w * 0.16;
  shadow(ctx, vx, room.floor, vw);
  r(ctx, '#e8342a', vx + vw * 0.3, room.floor - 58, vw * 0.34, 20); // cockpit hump
  r(ctx, '#bfe3f0', vx + vw * 0.36, room.floor - 54, vw * 0.14, 12); // canopy
  hl(ctx, vx + vw * 0.37, room.floor - 52, 6, 8, 0.5);
  r(ctx, '#e8342a', vx, room.floor - 40, vw, 24); // low body
  hl(ctx, vx, room.floor - 40, vw, 5);
  r(ctx, '#eef2f5', vx + vw * 0.12, room.floor - 38, vw * 0.12, 18); // number roundel
  r(ctx, '#14181d', vx + vw * 0.15, room.floor - 34, 6, 10); // the "7"
  r(ctx, '#14181d', vx + vw * 0.15, room.floor - 34, 10, 4);
  r(ctx, '#ffd166', vx, room.floor - 30, vw, 4); // sponsor stripe
  // big rear spoiler
  r(ctx, '#14181d', vx + vw - 14, room.floor - 66, 8, 28);
  r(ctx, '#e8342a', vx + vw - 26, room.floor - 70, 34, 8);
  hl(ctx, vx + vw - 26, room.floor - 70, 34, 3);
  // front wing
  r(ctx, '#14181d', vx - 10, room.floor - 22, 24, 6);
  for (const wx of [vx + 40, vx + vw - 84]) {
    disc(ctx, '#14181d', wx + 20, room.floor - 14, 17); // slick tire
    disc(ctx, '#f5c542', wx + 20, room.floor - 14, 7); // gold rim
  }
  // pit board + timing screen
  const pbx = room.x + room.w - 70;
  r(ctx, pal.furnitureDark, pbx, room.floor - 80, 6, 80);
  r(ctx, '#14181d', pbx - 24, room.floor - 104, 54, 28);
  r(ctx, '#ffd166', pbx - 18, room.floor - 98, 18, 8); // "BOX"
  r(ctx, '#ffd166', pbx - 18, room.floor - 86, 18, 6);
  r(ctx, pal.glow, pbx + 6, room.floor - 98, 18, 16); // timing
  // rolling tool chest + fuel cans + trophy
  const tcx = room.x + room.w * 0.72;
  shadow(ctx, tcx, room.floor, 56);
  r(ctx, '#e8342a', tcx, room.floor - 64, 56, 60);
  hl(ctx, tcx, room.floor - 64, 56, 4);
  for (let d = 0; d < 4; d++) {
    sh(ctx, tcx + 4, room.floor - 56 + d * 13, 48, 2, 0.4);
    r(ctx, pal.trim, tcx + 24, room.floor - 61 + d * 13, 10, 3);
  }
  disc(ctx, '#14181d', tcx + 12, room.floor - 3, 4);
  disc(ctx, '#14181d', tcx + 44, room.floor - 3, 4);
  r(ctx, '#e86a5a', room.x + 14, room.floor - 30, 18, 30); // fuel cans
  r(ctx, '#e86a5a', room.x + 36, room.floor - 24, 16, 24);
  r(ctx, pal.trim, room.x + 18, room.floor - 36, 8, 6);
  r(ctx, '#f5c542', tcx + 18, room.floor - 82, 16, 14); // trophy cup
  r(ctx, '#f5c542', tcx + 22, room.floor - 68, 8, 6);
  halo(ctx, '#f5c542', tcx + 12, room.floor - 86, 28, 20, 0.18);
};

export const elevatorP: Painter = (ctx, room, pal) => {
  // rails with rivets
  for (const rx of [room.x + 12, room.x + room.w - 20]) {
    r(ctx, pal.trim, rx, room.y, 8, room.h);
    for (let ry = room.y + 20; ry < room.y + room.h; ry += 48) r(ctx, pal.furnitureDark, rx + 2, ry, 4, 8);
  }
  // cables + counterweight
  r(ctx, pal.furnitureDark, room.x + room.w / 2 - 4, room.y, 4, room.h * 0.34);
  r(ctx, pal.furnitureDark, room.x + room.w / 2 + 4, room.y, 4, room.h * 0.3);
  r(ctx, pal.furnitureDark, room.x + room.w - 44, room.y + room.h * 0.1, 16, 36);
  hl(ctx, room.x + room.w - 44, room.y + room.h * 0.1, 16, 4);
  // cab with split doors + window + panel
  const cabY = room.y + room.h * 0.34;
  const cabH = room.h * 0.44;
  r(ctx, pal.furniture, room.x + 28, cabY, room.w - 56, cabH);
  hl(ctx, room.x + 28, cabY, room.w - 56, 6);
  r(ctx, pal.glow, room.x + 40, cabY + 16, room.w - 80, 20);
  ctx.globalAlpha = 0.5;
  r(ctx, pal.furnitureDark, room.x + room.w / 2 - 2, cabY + 8, 4, cabH - 16);
  ctx.globalAlpha = 1;
  r(ctx, pal.accent, room.x + room.w / 2 - 8, cabY + cabH - 24, 16, 16);
  // floor indicator lights
  for (let i = 0; i < 3; i++) {
    r(ctx, i === 1 ? pal.glow : pal.furnitureDark, room.x + room.w / 2 - 16 + i * 12, room.y + 8, 8, 8);
  }
  halo(ctx, pal.glow, room.x + room.w / 2 - 20, room.y + 4, 40, 16, 0.14);
};

export const siloP: Painter = (ctx, room, pal) => {
  const cx = room.x + room.w * 0.42;
  const bodyW = Math.min(104, room.w * 0.3);
  const topY = room.y + 32;
  const bodyH = room.floor - topY - 60;
  // steam vents
  hl(ctx, room.x + 16, room.floor - 60, 16, 24, 0.14);
  hl(ctx, room.x + 36, room.floor - 80, 12, 32, 0.1);
  // rocket body: panels, rivets, stripe, porthole
  r(ctx, pal.trim, cx - bodyW / 2, topY + 40, bodyW, bodyH);
  hl(ctx, cx - bodyW / 2, topY + 40, 12, bodyH, 0.2);
  ctx.globalAlpha = 0.3;
  for (let py = topY + 68; py < topY + bodyH; py += 48) r(ctx, pal.furnitureDark, cx - bodyW / 2 + 4, py, bodyW - 8, 4);
  ctx.globalAlpha = 1;
  for (let py = topY + 60; py < topY + bodyH - 10; py += 48) {
    r(ctx, pal.furnitureDark, cx - bodyW / 2 + 4, py, 4, 4);
    r(ctx, pal.furnitureDark, cx + bodyW / 2 - 8, py, 4, 4);
  }
  r(ctx, pal.accent, cx - bodyW / 2, topY + 40 + bodyH * 0.24, bodyW, 18);
  disc(ctx, pal.furnitureDark, cx, topY + 82, 18); // porthole rim
  disc(ctx, pal.glow, cx, topY + 82, 12);
  hl(ctx, cx - 6, topY + 76, 6, 6, 0.5);
  // nose cone
  r(ctx, pal.accent, cx - bodyW / 2 + 12, topY + 16, bodyW - 24, 24);
  r(ctx, pal.accent, cx - 16, topY, 32, 16);
  hl(ctx, cx - 16, topY, 32, 4);
  // fins
  r(ctx, pal.accent, cx - bodyW / 2 - 24, room.floor - 104, 24, 48);
  r(ctx, pal.accent, cx + bodyW / 2, room.floor - 104, 24, 48);
  sh(ctx, cx - bodyW / 2 - 24, room.floor - 68, 24, 12, 0.2);
  // engine bell + glow
  r(ctx, pal.furnitureDark, cx - 24, room.floor - 56, 48, 24);
  r(ctx, pal.furnitureDark, cx - 32, room.floor - 36, 64, 12);
  r(ctx, '#ffd166', cx - 16, room.floor - 24, 32, 12);
  halo(ctx, '#ffd166', cx - 32, room.floor - 24, 64, 20, 0.25);
  // launch pad
  r(ctx, pal.furnitureDark, cx - bodyW / 2 - 32, room.floor - 12, bodyW + 64, 12);
  // gantry tower with cross bracing + arm
  const gx = room.x + room.w - 52;
  r(ctx, pal.furnitureDark, gx, room.y + 24, 32, room.h - 56);
  ctx.globalAlpha = 0.5;
  for (let gy = room.y + 36; gy < room.y + room.h - 56; gy += 32) {
    r(ctx, pal.trim, gx + 2, gy, 28, 4);
  }
  ctx.globalAlpha = 1;
  r(ctx, pal.furniture, cx + bodyW / 2, topY + 88, gx - cx - bodyW / 2, 12);
  sh(ctx, cx + bodyW / 2, topY + 96, gx - cx - bodyW / 2, 4, 0.3);
  // hazard stripes + countdown console with the big red button
  for (let x = room.x + 4; x < room.x + room.w - 20; x += 28) {
    r(ctx, x % 56 < 28 ? pal.glow : pal.furnitureDark, x, room.floor - 6, 24, 6);
  }
  r(ctx, pal.furnitureDark, room.x + 12, room.floor - 52, 44, 44);
  r(ctx, '#0d1117', room.x + 18, room.floor - 46, 32, 16);
  r(ctx, '#ff5555', room.x + 22, room.floor - 42, 8, 8); // T-minus
  r(ctx, pal.glow, room.x + 34, room.floor - 42, 12, 8);
  disc(ctx, '#e8342a', room.x + 26, room.floor - 18, 7); // big red button (do not press)
  hl(ctx, room.x + 22, room.floor - 22, 4, 3, 0.5);
};

export const gemmineP: Painter = (ctx, room, pal, rng) => {
  // rough rock overlay on the walls
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < Math.floor(room.w / 30); i++) {
    r(ctx, '#2b2018', room.x + rng.int(0, room.w - 40), room.y + rng.int(0, room.h - 30), rng.int(20, 44), rng.int(12, 26));
  }
  ctx.globalAlpha = 1;
  // timber support frames
  for (let sx = room.x + 30; sx < room.x + room.w - 40; sx += 140) {
    r(ctx, '#8a5f3c', sx, room.y + 10, 12, room.h - 16);
    r(ctx, '#8a5f3c', sx + room.w > room.x + room.w ? 0 : sx + 96, room.y + 10, 12, room.h - 16);
    r(ctx, '#a8763e', sx - 8, room.y + 6, 128, 12); // lintel
    sh(ctx, sx - 8, room.y + 16, 128, 4, 0.3);
  }
  // glowing gem veins
  const gems = ['#7fd4ff', '#ff8fdc', '#a5ff9e', '#ffd166'];
  for (let i = 0; i < Math.floor(room.w / 60); i++) {
    const gx = room.x + rng.int(16, room.w - 30);
    const gy = room.y + rng.int(20, room.h - 40);
    const c = gems[rng.int(0, gems.length - 1)];
    r(ctx, c, gx, gy, 8, 14);
    r(ctx, c, gx - 5, gy + 5, 6, 8);
    r(ctx, c, gx + 9, gy + 3, 6, 9);
    hl(ctx, gx + 2, gy + 2, 3, 3, 0.6);
    halo(ctx, c, gx - 8, gy - 4, 28, 24, 0.15);
  }
  // rails + mine cart full of gems
  r(ctx, '#5a5f66', room.x, room.floor - 6, room.w, 3);
  for (let tx = room.x + 8; tx < room.x + room.w - 12; tx += 26) r(ctx, '#8a5f3c', tx, room.floor - 4, 14, 4);
  const cx = room.x + room.w * 0.4;
  shadow(ctx, cx, room.floor, 70);
  r(ctx, '#4a4f56', cx, room.floor - 44, 70, 34);
  hl(ctx, cx, room.floor - 44, 70, 4);
  disc(ctx, '#14181d', cx + 16, room.floor - 8, 8);
  disc(ctx, '#14181d', cx + 54, room.floor - 8, 8);
  for (let g = 0; g < 5; g++) {
    r(ctx, gems[rng.int(0, 3)], cx + 6 + g * 12, room.floor - 52 + rng.int(0, 6), 9, 10);
  }
  // pickaxe + lantern
  r(ctx, '#8a5f3c', room.x + 20, room.floor - 40, 5, 34); // handle
  r(ctx, '#8a99a8', room.x + 8, room.floor - 44, 30, 6); // head
  r(ctx, pal.trim, room.x + room.w - 40, room.y + 20, 3, 10);
  r(ctx, '#14181d', room.x + room.w - 46, room.y + 30, 16, 18);
  r(ctx, '#ffd166', room.x + room.w - 42, room.y + 34, 8, 10);
  halo(ctx, '#ffd166', room.x + room.w - 52, room.y + 28, 28, 24, 0.2);
};

export const observatoryP: Painter = (ctx, room, pal, rng) => {
  // star dome: dark band + stars across the ceiling half
  r(ctx, '#101528', room.x, room.y, room.w, room.h * 0.45);
  for (let i = 0; i < Math.floor(room.w / 14); i++) {
    const big = rng.chance(0.2);
    r(ctx, '#ffffff', room.x + rng.int(4, room.w - 6), room.y + rng.int(4, room.h * 0.42), big ? 3 : 2, big ? 3 : 2);
  }
  // roof slit with sky
  r(ctx, pal.trim, room.x + room.w * 0.55 - 6, room.y, 6, room.h * 0.45);
  r(ctx, '#1a2244', room.x + room.w * 0.55, room.y, room.w * 0.14, room.h * 0.45);
  r(ctx, '#f4f1de', room.x + room.w * 0.6, room.y + 12, 10, 10); // moon through the slit
  r(ctx, pal.trim, room.x + room.w * 0.55 + room.w * 0.14, room.y, 6, room.h * 0.45);
  // the big telescope: angled tube on a mount
  const bx = room.x + room.w * 0.42;
  const by = room.floor - 30;
  for (let i = 0; i < 7; i++) {
    r(ctx, pal.trim, bx + i * 14, by - 40 - i * 12, 26, 18); // stepped tube
  }
  hl(ctx, bx + 8, by - 48, 70, 4, 0.2);
  r(ctx, pal.accent, bx + 7 * 14, by - 40 - 7 * 12, 22, 16); // lens end
  r(ctx, pal.furnitureDark, bx - 6, by - 34, 22, 10); // eyepiece
  r(ctx, pal.furnitureDark, bx + 10, by - 24, 14, 24); // mount column
  r(ctx, pal.furnitureDark, bx - 6, by, 46, 6); // base
  // control desk with star chart
  const dx = room.x + 20;
  r(ctx, pal.furniture, dx, room.floor - 52, 90, 8);
  r(ctx, pal.furnitureDark, dx + 8, room.floor - 44, 6, 44);
  r(ctx, pal.furnitureDark, dx + 76, room.floor - 44, 6, 44);
  r(ctx, '#0d1826', dx + 10, room.floor - 82, 70, 28); // chart screen
  for (let i = 0; i < 6; i++) r(ctx, pal.glow, dx + 14 + rng.int(0, 60), room.floor - 78 + rng.int(0, 20), 2, 2);
  ctx.globalAlpha = 0.5;
  r(ctx, pal.glow, dx + 18, room.floor - 70, 50, 1); // constellation line
  ctx.globalAlpha = 1;
  // star chart poster + stool
  r(ctx, pal.trim, room.x + room.w - 70, room.y + room.h * 0.5, 48, 36);
  r(ctx, '#101528', room.x + room.w - 66, room.y + room.h * 0.5 + 4, 40, 28);
  for (let i = 0; i < 5; i++) r(ctx, '#ffffff', room.x + room.w - 62 + rng.int(0, 32), room.y + room.h * 0.5 + 6 + rng.int(0, 22), 2, 2);
  r(ctx, pal.furnitureDark, room.x + room.w - 40, room.floor - 26, 6, 26);
  r(ctx, pal.furniture, room.x + room.w - 50, room.floor - 32, 26, 6);
};

export const stairsP: Painter = (ctx, room, pal, rng) => {
  // staircase climbing left-low to right-high, with railing
  const steps = 8;
  const stepW = room.w / steps;
  const stepH = (room.h - 20) / steps;
  for (let i = 0; i < steps; i++) {
    const sx = room.x + i * stepW;
    const sy = room.floor - (i + 1) * stepH;
    r(ctx, pal.furniture, sx, sy, stepW + 1, room.floor - sy);
    hl(ctx, sx, sy, stepW + 1, 3);
    sh(ctx, sx, sy + stepH * 0.6, stepW + 1, 2, 0.2);
  }
  // railing
  for (let i = 0; i <= steps; i += 2) {
    const px = room.x + i * stepW + stepW * 0.4;
    const py = room.floor - (i + 1) * stepH;
    r(ctx, pal.trim, px, py - 34, 4, 34);
  }
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < steps; i++) {
    const px = room.x + i * stepW;
    const py = room.floor - (i + 1) * stepH - 34;
    r(ctx, pal.trim, px, py + stepH * 0.4, stepW + 2, 4); // handrail segments
  }
  ctx.globalAlpha = 1;
  if (rng.chance(0.5)) r(ctx, pal.accent, room.x + stepW * 0.3, room.floor - 6, 14, 6); // dropped sneaker
};

export const ladderP: Painter = (ctx, room, pal) => {
  // full-height ladder with rails, rungs, top hatch ring + caution stripe
  const cx = room.x + room.w / 2;
  r(ctx, pal.trim, cx - 20, room.y, 6, room.h);
  r(ctx, pal.trim, cx + 14, room.y, 6, room.h);
  for (let y = room.y + 14; y < room.floor - 6; y += 24) {
    r(ctx, pal.furniture, cx - 16, y, 32, 5);
    sh(ctx, cx - 16, y + 5, 32, 2, 0.3);
  }
  // hatch ring at the top
  r(ctx, pal.furnitureDark, cx - 28, room.y, 56, 8);
  r(ctx, pal.glow, cx - 6, room.y + 2, 12, 4);
  // caution stripes at the base
  for (let x = room.x + 6; x < room.x + room.w - 18; x += 20) {
    r(ctx, x % 40 < 20 ? '#ffd166' : '#14181d', x, room.floor - 5, 16, 5);
  }
  halo(ctx, pal.glow, cx - 12, room.y + 2, 24, 10, 0.2);
};
