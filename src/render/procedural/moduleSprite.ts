/**
 * Procedural placeholder sprite generator: draws a themed room (walls, floor,
 * background) then hands the interior to the kind's furniture painter.
 * Deterministic per sprite key. Output is exactly w*64 × h*64 art pixels —
 * identical dimensions to what final PNG art must ship at.
 */
import { ART_CELL } from '../../core/grid';
import type { ModuleDef, ThemePalette } from '../../core/types';
import { createRng } from './rng';
import { getPainter, type Interior } from './furniture';

const WALL = 4; // wall thickness in art px
const FLOOR_BAND = 8; // visible floor depth

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

  // Outer wall + inner shadow + room background
  ctx.fillStyle = pal.wall;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = pal.wallDark;
  ctx.fillRect(WALL - 1, WALL - 1, W - 2 * (WALL - 1), H - 2 * (WALL - 1));
  ctx.fillStyle = pal.roomBg;
  ctx.fillRect(WALL, WALL, W - 2 * WALL, H - 2 * WALL);

  // Floor band
  ctx.fillStyle = pal.floor;
  ctx.fillRect(WALL, H - WALL - FLOOR_BAND, W - 2 * WALL, FLOOR_BAND);
  ctx.fillStyle = pal.wallDark;
  ctx.fillRect(WALL, H - WALL - FLOOR_BAND, W - 2 * WALL, 1);

  // Subtle wall texture: sparse studs/rivets/stones depending on nothing but rng
  ctx.fillStyle = pal.wallDark;
  for (let x = WALL + 6; x < W - WALL - 6; x += 16) {
    if (rng.chance(0.35)) ctx.fillRect(x, WALL + 2, 2, 2);
  }
  // Trim line under the ceiling
  ctx.fillStyle = pal.trim;
  ctx.fillRect(WALL, WALL + 1, W - 2 * WALL, 1);

  const room: Interior = {
    x: WALL,
    y: WALL,
    w: W - 2 * WALL,
    h: H - 2 * WALL - FLOOR_BAND,
    floor: H - WALL - FLOOR_BAND,
  };
  getPainter(def.kind)(ctx, room, pal, rng, def);

  // Corner bolts — makes modules read as "installed" units
  ctx.fillStyle = pal.trim;
  for (const [bx, by] of [
    [1, 1],
    [W - 3, 1],
    [1, H - 3],
    [W - 3, H - 3],
  ]) {
    ctx.fillRect(bx, by, 2, 2);
  }

  return canvas;
}
