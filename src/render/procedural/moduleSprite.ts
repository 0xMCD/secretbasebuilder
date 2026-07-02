/**
 * Procedural placeholder sprite generator at the high-detail resolution:
 * every cell is ART_CELL (128) art pixels, so a 3×1 bedroom is a 384×128
 * canvas — the same dimensions final PNG art must ship at.
 * Draws a themed room shell (shaded walls, panel seams, plank floor, trim)
 * then hands the interior to the kind's furniture painter.
 */
import { ART_CELL } from '../../core/grid';
import type { ModuleDef, ThemePalette } from '../../core/types';
import { createRng } from './rng';
import { getPainter, type Interior } from './furniture';

const WALL = 8; // wall thickness in art px
const FLOOR_BAND = 16; // visible floor depth

export function generateModuleSprite(
  def: ModuleDef,
  themeId: string,
  pal: ThemePalette,
): HTMLCanvasElement {
  const W = def.w * ART_CELL;
  const H = def.h * ART_CELL;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const rng = createRng(`${def.kind}_${def.w}x${def.h}_${themeId}`);

  // Outer wall + inner shadow ring + room background
  ctx.fillStyle = pal.wall;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = pal.wallDark;
  ctx.fillRect(WALL - 2, WALL - 2, W - 2 * (WALL - 2), H - 2 * (WALL - 2));
  ctx.fillStyle = pal.roomBg;
  ctx.fillRect(WALL, WALL, W - 2 * WALL, H - 2 * WALL);

  // Back-wall texture: vertical panel seams + darker wainscot band low down
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = pal.wallDark;
  for (let x = WALL + 40; x < W - WALL - 8; x += 40) {
    ctx.fillRect(x, WALL, 2, H - 2 * WALL);
  }
  ctx.globalAlpha = 0.16;
  ctx.fillRect(WALL, H - WALL - FLOOR_BAND - Math.round(H * 0.2), W - 2 * WALL, Math.round(H * 0.2));
  ctx.globalAlpha = 1;

  // Ceiling: trim line + soft shadow band under it
  ctx.fillStyle = pal.trim;
  ctx.fillRect(WALL, WALL, W - 2 * WALL, 2);
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = pal.wallDark;
  ctx.fillRect(WALL, WALL + 2, W - 2 * WALL, 6);
  ctx.globalAlpha = 1;

  // Floor band: planks with seams + baseboard shadow
  const floorTop = H - WALL - FLOOR_BAND;
  ctx.fillStyle = pal.floor;
  ctx.fillRect(WALL, floorTop, W - 2 * WALL, FLOOR_BAND);
  ctx.fillStyle = pal.wallDark;
  ctx.fillRect(WALL, floorTop, W - 2 * WALL, 2);
  ctx.globalAlpha = 0.35;
  for (let x = WALL + rng.int(10, 24); x < W - WALL - 6; x += rng.int(22, 34)) {
    ctx.fillRect(x, floorTop + 3, 2, FLOOR_BAND - 4);
  }
  ctx.fillRect(WALL, floorTop + Math.floor(FLOOR_BAND / 2), W - 2 * WALL, 1);
  ctx.globalAlpha = 1;

  // Sparse wall studs/rivets
  ctx.fillStyle = pal.wallDark;
  for (let x = WALL + 14; x < W - WALL - 14; x += 32) {
    if (rng.chance(0.35)) ctx.fillRect(x, WALL + 5, 3, 3);
  }

  const room: Interior = {
    x: WALL,
    y: WALL,
    w: W - 2 * WALL,
    h: H - 2 * WALL - FLOOR_BAND,
    floor: floorTop,
  };
  getPainter(def.kind)(ctx, room, pal, rng, def);

  // Corner bolts with a highlight pixel — modules read as "installed" units
  for (const [bx, by] of [
    [2, 2],
    [W - 6, 2],
    [2, H - 6],
    [W - 6, H - 6],
  ]) {
    ctx.fillStyle = pal.trim;
    ctx.fillRect(bx, by, 4, 4);
    ctx.fillStyle = pal.glow;
    ctx.fillRect(bx, by, 1, 1);
  }

  return canvas;
}
