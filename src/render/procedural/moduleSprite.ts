/**
 * Procedural placeholder sprite generator at the high-fidelity resolution:
 * every cell is ART_CELL (256) art pixels, so a 3×1 bedroom is a 768×256
 * canvas — the same dimensions final PNG art must ship at.
 *
 * The room SHELL is theme-differentiated construction, not tint:
 *   tech      → riveted metal panels, glowing ceiling strip, treadplate floor
 *   fantasy   → staggered stone blocks, wooden ceiling beam, wide plank floor
 *   realistic → poured concrete with seams/stains, I-beam ceiling, jointed slab
 *   cozy      → striped wallpaper over a slatted wainscot, warm plank floor
 *   glam      → tufted velvet walls with buttons, gold trim, checkerboard floor
 * Then themeFlavor() stamps signature props and the kind painter furnishes.
 */
import { ART_CELL } from '../../core/grid';
import type { ModuleDef, ThemePalette } from '../../core/types';
import { beginFx, endFx, type FxHint } from '../fx';
import { createRng } from './rng';
import type { Rng } from './rng';
import { getPainter } from './furniture';
import { DECOR_META } from './roomsDecor';
import { halo, hl, r, sh, themeFlavor, type Ctx, type Interior } from './kit';

const WALL = 16; // wall thickness in art px
const FLOOR_BAND = 32; // visible floor depth
export { WALL, FLOOR_BAND };

export interface GeneratedSprite {
  canvas: HTMLCanvasElement;
  /** Ambient-animation hints collected while painting (see render/fx.ts). */
  fx: FxHint[];
}

export function generateModuleSprite(
  def: ModuleDef,
  themeId: string,
  pal: ThemePalette,
  variant = 0,
): GeneratedSprite {
  const W = def.w * ART_CELL;
  const H = def.h * ART_CELL;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // The variant seeds every rng roll (shell stains, plank joints, shelf
  // books, prop chances), so variants differ naturally with no painter work.
  const rng = createRng(`${def.kind}_${def.w}x${def.h}_${themeId}_v${variant}`);
  beginFx();

  // Decor props are transparent-background sprites: no shell, no bolts —
  // just the prop, scaled per kind (see DECOR_META) around its floor or
  // ceiling anchor so props come in a variety of sizes.
  if (def.layer === 'decor') {
    const meta = DECOR_META[def.kind] ?? { scale: 0.66, anchor: 'floor' as const };
    const px = W / 2;
    const py = meta.anchor === 'floor' ? H - 24 : 12;
    ctx.translate(px, py);
    ctx.scale(meta.scale, meta.scale);
    ctx.translate(-px, -py);
    const room: Interior = { x: 12, y: 12, w: W - 24, h: H - 36, floor: H - 24 };
    getPainter(def.kind)(ctx, room, pal, rng, def, themeId);
    return { canvas, fx: endFx() };
  }

  drawShell(ctx, W, H, pal, themeId, rng);

  const room: Interior = {
    x: WALL,
    y: WALL,
    w: W - 2 * WALL,
    h: H - 2 * WALL - FLOOR_BAND,
    floor: H - WALL - FLOOR_BAND,
  };
  themeFlavor(ctx, room, pal, rng, themeId);
  getPainter(def.kind)(ctx, room, pal, rng, def, themeId);

  // Corner bolts with a highlight pixel — modules read as "installed" units
  for (const [bx, by] of [
    [4, 4],
    [W - 12, 4],
    [4, H - 12],
    [W - 12, H - 12],
  ]) {
    r(ctx, pal.trim, bx, by, 8, 8);
    r(ctx, pal.glow, bx, by, 2, 2);
  }

  return { canvas, fx: endFx() };
}

function drawShell(ctx: Ctx, W: number, H: number, pal: ThemePalette, theme: string, rng: Rng): void {
  // Base: outer wall, inner shadow ring, room background
  r(ctx, pal.wall, 0, 0, W, H);
  r(ctx, pal.wallDark, WALL - 4, WALL - 4, W - 2 * (WALL - 4), H - 2 * (WALL - 4));
  r(ctx, pal.roomBg, WALL, WALL, W - 2 * WALL, H - 2 * WALL);

  const iw = W - 2 * WALL; // interior width
  const floorTop = H - WALL - FLOOR_BAND;

  switch (theme) {
    case 'tech': {
      // metal wall panels with rivets
      ctx.globalAlpha = 0.3;
      for (let x = WALL + 80; x < W - WALL - 10; x += 80) r(ctx, pal.wallDark, x, WALL, 4, H - 2 * WALL);
      r(ctx, pal.wallDark, WALL, WALL + (H - 2 * WALL) * 0.45, iw, 4);
      ctx.globalAlpha = 1;
      for (let x = WALL + 76; x < W - WALL - 10; x += 80) {
        r(ctx, pal.trim, x, WALL + 10, 4, 4);
        r(ctx, pal.trim, x, floorTop - 14, 4, 4);
      }
      // glowing ceiling strip
      r(ctx, pal.accent, WALL, WALL, iw, 3);
      halo(ctx, pal.accent, WALL, WALL + 3, iw, 10, 0.1);
      // treadplate floor
      r(ctx, pal.floor, WALL, floorTop, iw, FLOOR_BAND);
      r(ctx, pal.wallDark, WALL, floorTop, iw, 3);
      ctx.globalAlpha = 0.35;
      for (let x = WALL + 8; x < W - WALL - 12; x += 22) {
        r(ctx, pal.wallDark, x, floorTop + 8, 10, 3);
        r(ctx, pal.wallDark, x + 6, floorTop + 18, 10, 3);
      }
      ctx.globalAlpha = 1;
      r(ctx, pal.accent, WALL, floorTop + FLOOR_BAND - 4, iw, 2); // edge light
      break;
    }
    case 'fantasy': {
      // staggered stone blocks
      ctx.globalAlpha = 0.32;
      const bh = 44;
      const bw = 84;
      for (let row = 0; row * bh < H - 2 * WALL; row++) {
        const y = WALL + row * bh;
        r(ctx, pal.wallDark, WALL, y, iw, 3);
        const off = row % 2 === 0 ? 0 : bw / 2;
        for (let x = WALL + off; x < W - WALL; x += bw) r(ctx, pal.wallDark, x, y, 3, Math.min(bh, floorTop - y));
      }
      ctx.globalAlpha = 1;
      // wooden ceiling beam
      r(ctx, pal.furniture, WALL, WALL, iw, 12);
      sh(ctx, WALL, WALL + 12, iw, 4, 0.3);
      r(ctx, pal.furnitureDark, WALL + 20, WALL + 2, 8, 8);
      r(ctx, pal.furnitureDark, W - WALL - 28, WALL + 2, 8, 8);
      // wide plank floor
      r(ctx, pal.floor, WALL, floorTop, iw, FLOOR_BAND);
      r(ctx, pal.wallDark, WALL, floorTop, iw, 3);
      ctx.globalAlpha = 0.4;
      for (let x = WALL + rng.int(30, 60); x < W - WALL - 12; x += rng.int(70, 110)) {
        r(ctx, pal.wallDark, x, floorTop + 4, 4, FLOOR_BAND - 6);
      }
      r(ctx, pal.wallDark, WALL, floorTop + FLOOR_BAND / 2, iw, 2);
      ctx.globalAlpha = 1;
      break;
    }
    case 'realistic': {
      // concrete panels with seams, corner bolt plates, faint stains
      ctx.globalAlpha = 0.25;
      for (let x = WALL + 120; x < W - WALL - 10; x += 120) r(ctx, pal.wallDark, x, WALL, 3, H - 2 * WALL);
      r(ctx, pal.wallDark, WALL, WALL + (H - 2 * WALL) * 0.5, iw, 3);
      ctx.globalAlpha = 0.08;
      for (let i = 0; i < Math.max(2, Math.floor(iw / 200)); i++) {
        r(ctx, '#000000', WALL + rng.int(0, iw - 60), WALL + rng.int(10, 60), rng.int(30, 70), rng.int(20, 50)); // stains
      }
      ctx.globalAlpha = 1;
      // I-beam ceiling
      r(ctx, pal.wallDark, WALL, WALL, iw, 14);
      r(ctx, pal.trim, WALL, WALL + 3, iw, 2);
      r(ctx, pal.trim, WALL, WALL + 11, iw, 2);
      for (let x = WALL + 40; x < W - WALL - 20; x += 90) r(ctx, pal.trim, x, WALL + 5, 4, 6); // rivets
      // jointed slab floor
      r(ctx, pal.floor, WALL, floorTop, iw, FLOOR_BAND);
      r(ctx, pal.wallDark, WALL, floorTop, iw, 3);
      ctx.globalAlpha = 0.35;
      for (let x = WALL + 90; x < W - WALL - 12; x += 90) r(ctx, pal.wallDark, x, floorTop + 3, 3, FLOOR_BAND - 4);
      ctx.globalAlpha = 0.2;
      r(ctx, pal.wallDark, WALL + rng.int(20, 80), floorTop + 10, rng.int(30, 80), 2); // crack
      ctx.globalAlpha = 1;
      break;
    }
    case 'glam': {
      // tufted velvet: diamond lattice + buttons
      ctx.globalAlpha = 0.2;
      const sp = 56;
      for (let d = -H; d < iw + H; d += sp) {
        for (let t = 0; t < H - 2 * WALL - FLOOR_BAND; t += 3) {
          const x1 = WALL + d + t;
          const x2 = WALL + d - t;
          if (x1 >= WALL && x1 < W - WALL) r(ctx, pal.wallDark, x1, WALL + t, 2, 3);
          if (x2 >= WALL && x2 < W - WALL) r(ctx, pal.wallDark, x2, WALL + t, 2, 3);
        }
      }
      ctx.globalAlpha = 1;
      for (let y = WALL + sp / 2; y < floorTop - 10; y += sp / 2) {
        for (let x = WALL + (Math.round(y / (sp / 2)) % 2 === 0 ? sp / 2 : sp); x < W - WALL - 6; x += sp) {
          r(ctx, pal.glow, x, y, 4, 4); // buttons
        }
      }
      // gold trims
      r(ctx, '#f5c542', WALL, WALL, iw, 3);
      r(ctx, '#f5c542', WALL, WALL + 6, iw, 2);
      // checkerboard marble floor
      r(ctx, pal.floor, WALL, floorTop, iw, FLOOR_BAND);
      const tile = 32;
      for (let x = WALL, i = 0; x < W - WALL; x += tile, i++) {
        if (i % 2 === 0) hl(ctx, x, floorTop + 3, Math.min(tile, W - WALL - x), FLOOR_BAND - 3, 0.18);
        else sh(ctx, x, floorTop + 3, Math.min(tile, W - WALL - x), FLOOR_BAND - 3, 0.18);
      }
      r(ctx, '#f5c542', WALL, floorTop, iw, 3);
      break;
    }
    default: {
      // cozy: striped wallpaper + slatted wainscot + warm planks
      ctx.globalAlpha = 0.12;
      for (let x = WALL + 20; x < W - WALL - 10; x += 40) {
        r(ctx, pal.accent, x, WALL, 8, H - 2 * WALL);
        r(ctx, pal.accent, x + 14, WALL, 3, H - 2 * WALL);
      }
      ctx.globalAlpha = 1;
      // wainscot band
      const wainH = 56;
      r(ctx, pal.furniture, WALL, floorTop - wainH, iw, wainH);
      hl(ctx, WALL, floorTop - wainH, iw, 4);
      ctx.globalAlpha = 0.3;
      for (let x = WALL + 24; x < W - WALL - 10; x += 24) r(ctx, pal.furnitureDark, x, floorTop - wainH + 6, 3, wainH - 8);
      ctx.globalAlpha = 1;
      r(ctx, pal.trim, WALL, floorTop - wainH - 4, iw, 4); // chair rail
      // warm plank floor
      r(ctx, pal.floor, WALL, floorTop, iw, FLOOR_BAND);
      r(ctx, pal.wallDark, WALL, floorTop, iw, 3);
      ctx.globalAlpha = 0.35;
      for (let x = WALL + 40; x < W - WALL - 12; x += 80) r(ctx, pal.wallDark, x, floorTop + 4, 3, FLOOR_BAND - 6);
      for (let x = WALL + 14; x < W - WALL - 20; x += 60) r(ctx, pal.wallDark, x, floorTop + rng.int(8, 22), rng.int(8, 18), 2); // grain
      ctx.globalAlpha = 1;
    }
  }
}
