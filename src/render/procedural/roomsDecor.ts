/**
 * Painters: DECOR props (1×1, transparent background, placed inside rooms).
 * Drawn big and readable — each prop fills most of its cell and sits on the
 * hosting room's floor. Theme palette flavors the accents.
 */
import { disc, halo, hl, r, ring, sh, type Painter } from './kit';

/**
 * Per-prop render size + pivot. Painters draw at full-cell scale; the sprite
 * generator scales them down around this anchor so props come in a variety of
 * believable sizes (a lava lamp is NOT the size of a fridge).
 */
export const DECOR_META: Record<string, { scale: number; anchor: 'floor' | 'ceiling' }> = {
  plantpot: { scale: 0.72, anchor: 'floor' },
  trophy: { scale: 0.58, anchor: 'floor' },
  banner: { scale: 0.95, anchor: 'ceiling' },
  discoball: { scale: 0.62, anchor: 'ceiling' },
  sleepingpet: { scale: 0.66, anchor: 'floor' },
  lavalamp: { scale: 0.48, anchor: 'floor' },
  painting: { scale: 0.75, anchor: 'ceiling' },
  robobuddy: { scale: 0.62, anchor: 'floor' },
};

export const plantpotP: Painter = (ctx, room, pal) => {
  const cx = room.x + room.w / 2;
  sh(ctx, cx - 40, room.floor - 4, 80, 4, 0.25);
  r(ctx, pal.furnitureDark, cx - 34, room.floor - 52, 68, 52); // pot
  hl(ctx, cx - 34, room.floor - 52, 68, 8);
  r(ctx, pal.trim, cx - 40, room.floor - 62, 80, 12);
  // monstera: tall stems + big leaves
  const GREEN = '#3e8a4a';
  const LIGHT = '#5cb45c';
  r(ctx, GREEN, cx - 4, room.floor - 160, 8, 100);
  r(ctx, GREEN, cx - 26, room.floor - 140, 6, 80);
  r(ctx, GREEN, cx + 20, room.floor - 132, 6, 72);
  for (const [lx, ly, s] of [
    [cx - 58, room.floor - 168, 36],
    [cx + 18, room.floor - 178, 40],
    [cx - 20, room.floor - 196, 34],
    [cx - 66, room.floor - 128, 28],
    [cx + 40, room.floor - 138, 30],
  ]) {
    r(ctx, LIGHT, lx, ly, s, s * 0.62);
    r(ctx, GREEN, lx + s * 0.3, ly + 4, s * 0.14, s * 0.5); // leaf split
    hl(ctx, lx + 4, ly + 3, s * 0.3, 4, 0.25);
  }
};

export const trophyP: Painter = (ctx, room, pal) => {
  const cx = room.x + room.w / 2;
  const GOLD = '#f5c542';
  sh(ctx, cx - 50, room.floor - 4, 100, 4, 0.25);
  r(ctx, pal.furnitureDark, cx - 50, room.floor - 34, 100, 34); // pedestal
  hl(ctx, cx - 50, room.floor - 34, 100, 6);
  r(ctx, pal.trim, cx - 20, room.floor - 90, 40, 12); // plinth
  r(ctx, GOLD, cx - 10, room.floor - 108, 20, 20); // stem
  r(ctx, GOLD, cx - 34, room.floor - 158, 68, 52); // cup
  hl(ctx, cx - 28, room.floor - 152, 12, 40, 0.4);
  r(ctx, GOLD, cx - 50, room.floor - 152, 16, 34); // handles
  r(ctx, GOLD, cx + 34, room.floor - 152, 16, 34);
  r(ctx, '#0d1117', cx - 44, room.floor - 146, 6, 22);
  r(ctx, '#0d1117', cx + 38, room.floor - 146, 6, 22);
  halo(ctx, GOLD, cx - 44, room.floor - 168, 88, 66, 0.15);
  // star + engraving
  r(ctx, '#ffffff', cx - 3, room.floor - 176, 6, 14);
  r(ctx, '#ffffff', cx - 7, room.floor - 172, 14, 6);
  sh(ctx, cx - 30, room.floor - 26, 60, 4, 0.4);
};

export const bannerP: Painter = (ctx, room, pal) => {
  // pennant string draped across the top of the cell
  const colors = [pal.accent, '#ffd166', '#7fc95c', '#ff8fdc', '#38e1ff'];
  const y0 = room.y + 12;
  const n = 6;
  const span = room.w - 16;
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const px = room.x + 8 + t * span;
    const dip = Math.sin(t * Math.PI) * 26;
    // string segment
    if (i < n - 1) {
      const nt = (i + 1) / (n - 1);
      const nx = room.x + 8 + nt * span;
      const ndip = Math.sin(nt * Math.PI) * 26;
      r(ctx, '#e8eef5', px, y0 + dip, nx - px, 3);
      void ndip;
    }
    // pennant triangle (stepped)
    const c = colors[i % colors.length];
    for (let s = 0; s < 5; s++) {
      r(ctx, c, px - 14 + s * 3, y0 + dip + 3 + s * 8, 28 - s * 6, 8);
    }
  }
  ctx.globalAlpha = 1;
};

export const discoballP: Painter = (ctx, room, pal) => {
  const cx = room.x + room.w / 2;
  const cy = room.y + 84;
  r(ctx, pal.trim, cx - 2, room.y, 4, 40); // chain
  disc(ctx, '#c9ced4', cx, cy, 44);
  // mirror grid
  ctx.globalAlpha = 0.4;
  for (let gy = cy - 40; gy < cy + 40; gy += 12) r(ctx, '#5a6470', cx - 44, gy, 88, 2);
  for (let gx = cx - 40; gx < cx + 44; gx += 12) r(ctx, '#5a6470', gx, cy - 44, 2, 88);
  ctx.globalAlpha = 1;
  hl(ctx, cx - 30, cy - 34, 20, 14, 0.5);
  halo(ctx, '#ffffff', cx - 56, cy - 56, 112, 112, 0.1);
  // colored light rays + floor dots
  const colors = [pal.accent, '#ff8fdc', '#ffd166', '#38e1ff'];
  colors.forEach((c, i) => {
    const ang = (i / colors.length) * Math.PI + 0.4;
    const dx = Math.cos(ang) * 70;
    const dy = Math.sin(ang) * 60;
    ctx.globalAlpha = 0.35;
    r(ctx, c, cx + dx - 4, cy + dy, 8, 8);
    ctx.globalAlpha = 1;
    disc(ctx, c, room.x + 24 + i * ((room.w - 48) / 3), room.floor - 6, 5); // floor spots
  });
};

export const sleepingpetP: Painter = (ctx, room, pal) => {
  const cx = room.x + room.w / 2;
  const FUR = '#a8763e';
  const DARK = '#7a5228';
  // round mat
  sh(ctx, cx - 64, room.floor - 6, 128, 6, 0.2);
  r(ctx, pal.accent, cx - 70, room.floor - 14, 140, 14);
  hl(ctx, cx - 60, room.floor - 12, 120, 3, 0.2);
  // curled dog: body, head resting, ear, tail wrap
  disc(ctx, FUR, cx, room.floor - 46, 42);
  r(ctx, FUR, cx - 42, room.floor - 46, 84, 32);
  disc(ctx, DARK, cx + 26, room.floor - 34, 16); // snout/head
  r(ctx, DARK, cx + 14, room.floor - 52, 14, 18); // ear
  r(ctx, FUR, cx - 66, room.floor - 34, 30, 12); // tail
  disc(ctx, FUR, cx - 66, room.floor - 28, 8);
  r(ctx, '#14181d', cx + 30, room.floor - 38, 6, 3); // closed eye
  disc(ctx, '#14181d', cx + 40, room.floor - 28, 4); // nose
  // zzz
  ctx.globalAlpha = 0.8;
  r(ctx, '#ffffff', cx + 44, room.floor - 92, 14, 4);
  r(ctx, '#ffffff', cx + 48, room.floor - 84, 8, 3);
  r(ctx, '#ffffff', cx + 54, room.floor - 104, 18, 5);
  ctx.globalAlpha = 1;
};

export const lavalampP: Painter = (ctx, room, pal) => {
  const cx = room.x + room.w / 2;
  sh(ctx, cx - 30, room.floor - 4, 60, 4, 0.25);
  r(ctx, pal.furnitureDark, cx - 28, room.floor - 20, 56, 20); // base
  hl(ctx, cx - 28, room.floor - 20, 56, 4);
  // glass cone with goo
  r(ctx, '#3a2a5c', cx - 22, room.floor - 130, 44, 110);
  r(ctx, '#4a3a6c', cx - 18, room.floor - 126, 8, 102);
  disc(ctx, '#ff8fdc', cx, room.floor - 50, 16); // blobs
  disc(ctx, '#ff8fdc', cx - 4, room.floor - 92, 11);
  disc(ctx, '#ff8fdc', cx + 8, room.floor - 116, 7);
  r(ctx, pal.furnitureDark, cx - 16, room.floor - 144, 32, 14); // cap
  halo(ctx, '#ff8fdc', cx - 40, room.floor - 140, 80, 130, 0.18);
};

export const paintingP: Painter = (ctx, room) => {
  const cx = room.x + room.w / 2;
  const fy = room.y + 40;
  const fw = 150;
  const fh = 110;
  // ornate gold frame
  r(ctx, '#f5c542', cx - fw / 2 - 10, fy - 10, fw + 20, fh + 20);
  r(ctx, '#c9962e', cx - fw / 2 - 4, fy - 4, fw + 8, fh + 8);
  for (const [bx, by] of [
    [cx - fw / 2 - 10, fy - 10],
    [cx + fw / 2 + 2, fy - 10],
    [cx - fw / 2 - 10, fy + fh + 2],
    [cx + fw / 2 + 2, fy + fh + 2],
  ]) {
    disc(ctx, '#f5c542', bx + 4, by + 4, 7); // corner rosettes
  }
  // the landscape: sky, sun, mountains, lake
  r(ctx, '#9fd8ff', cx - fw / 2, fy, fw, fh);
  disc(ctx, '#ffd166', cx + fw / 2 - 30, fy + 24, 14);
  for (let s = 0; s < 7; s++) r(ctx, '#5a6b7d', cx - fw / 2 + 14 + s * 5, fy + 34 + s * 6, 64 - s * 10, 8);
  for (let s = 0; s < 5; s++) r(ctx, '#7a8a9d', cx + 4 + s * 5, fy + 52 + s * 5, 48 - s * 9, 7);
  r(ctx, '#4a90b8', cx - fw / 2, fy + fh - 28, fw, 28); // lake
  hl(ctx, cx - fw / 2 + 20, fy + fh - 20, 40, 3, 0.4);
  halo(ctx, '#f5c542', cx - fw / 2 - 16, fy - 16, fw + 32, fh + 32, 0.08);
};

export const robobuddyP: Painter = (ctx, room, pal) => {
  const cx = room.x + room.w / 2;
  sh(ctx, cx - 40, room.floor - 4, 80, 4, 0.25);
  // treads
  r(ctx, '#14181d', cx - 38, room.floor - 18, 76, 18);
  disc(ctx, '#3a3f45', cx - 26, room.floor - 9, 7);
  disc(ctx, '#3a3f45', cx, room.floor - 9, 7);
  disc(ctx, '#3a3f45', cx + 26, room.floor - 9, 7);
  // body
  r(ctx, pal.trim, cx - 32, room.floor - 78, 64, 60);
  hl(ctx, cx - 32, room.floor - 78, 64, 8);
  r(ctx, pal.accent, cx - 32, room.floor - 40, 64, 6); // belt light
  // face screen: smiley
  r(ctx, '#0d1117', cx - 24, room.floor - 70, 48, 26);
  r(ctx, pal.glow, cx - 14, room.floor - 64, 6, 8); // eyes
  r(ctx, pal.glow, cx + 8, room.floor - 64, 6, 8);
  r(ctx, pal.glow, cx - 10, room.floor - 52, 20, 4); // smile
  // arms + antenna
  r(ctx, pal.trim, cx - 44, room.floor - 66, 12, 8);
  r(ctx, pal.trim, cx + 32, room.floor - 66, 12, 8);
  disc(ctx, pal.glow, cx + 40, room.floor - 62, 5); // waving hand
  r(ctx, pal.trim, cx - 2, room.floor - 92, 4, 14);
  disc(ctx, '#ff5555', cx, room.floor - 96, 5);
  halo(ctx, '#ff5555', cx - 8, room.floor - 104, 16, 14, 0.3);
  ring(ctx, pal.glow, cx, room.floor - 62, 30, 2); // beep-boop aura, why not
};
