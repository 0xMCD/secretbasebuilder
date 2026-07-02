/**
 * Draws everything that isn't a module: sky, weather, the aboveground
 * structure, the surface strip, and the dirt mass. All in world art-pixel
 * space (the renderer sets the camera transform first).
 * One environment = structure + weather + dirt bundle (see environments.json).
 */
import { ART_CELL, COLS, GROUND_ROW, ROWS } from '../core/grid';
import type { EnvironmentDef } from '../core/types';
import { createRng } from './procedural/rng';

const WORLD_W = COLS * ART_CELL;
const GROUND_Y = GROUND_ROW * ART_CELL;
const WORLD_H = ROWS * ART_CELL;

export function drawEnvironment(ctx: CanvasRenderingContext2D, env: EnvironmentDef): void {
  drawSky(ctx, env);
  drawWeather(ctx, env);
  drawDirt(ctx, env);
  drawSurfaceStrip(ctx, env);
  drawStructure(ctx, env);
  drawHatch(ctx, env);
}

function drawSky(ctx: CanvasRenderingContext2D, env: EnvironmentDef): void {
  // Banded gradient (pixel-art friendly, no smooth ramps)
  const bands = 8;
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = mix(env.palette.skyTop, env.palette.skyBottom, i / (bands - 1));
    ctx.fillRect(0, (GROUND_Y * i) / bands, WORLD_W, GROUND_Y / bands + 1);
  }
}

function drawWeather(ctx: CanvasRenderingContext2D, env: EnvironmentDef): void {
  const rng = createRng(`weather_${env.id}`);
  switch (env.weather) {
    case 'sunny': {
      ctx.fillStyle = '#ffe28a';
      ctx.fillRect(WORLD_W - 260, 40, 56, 56);
      ctx.fillStyle = '#fff3c2';
      ctx.fillRect(WORLD_W - 248, 52, 32, 32);
      for (let i = 0; i < 5; i++) cloud(ctx, rng.int(0, WORLD_W - 200), rng.int(30, 160), rng.int(80, 150), '#ffffff');
      break;
    }
    case 'rain': {
      for (let i = 0; i < 7; i++) cloud(ctx, rng.int(0, WORLD_W - 220), rng.int(20, 120), rng.int(120, 220), '#c6ccd4');
      ctx.fillStyle = 'rgba(160, 190, 220, 0.75)';
      for (let i = 0; i < 260; i++) {
        ctx.fillRect(rng.int(0, WORLD_W), rng.int(140, GROUND_Y - 8), 1, rng.int(5, 9));
      }
      break;
    }
    case 'snow': {
      for (let i = 0; i < 4; i++) cloud(ctx, rng.int(0, WORLD_W - 220), rng.int(20, 100), rng.int(120, 200), '#e8edf2');
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 220; i++) {
        const s = rng.chance(0.3) ? 3 : 2;
        ctx.fillRect(rng.int(0, WORLD_W), rng.int(80, GROUND_Y - 6), s, s);
      }
      break;
    }
    case 'night': {
      ctx.fillStyle = '#f4f1de';
      ctx.fillRect(WORLD_W - 300, 50, 44, 44); // moon
      ctx.fillStyle = mix(env.palette.skyTop, '#000000', 0.15);
      ctx.fillRect(WORLD_W - 288, 58, 20, 20); // crater shadow
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 130; i++) {
        ctx.fillRect(rng.int(0, WORLD_W), rng.int(10, GROUND_Y - 60), rng.chance(0.2) ? 2 : 1, rng.chance(0.2) ? 2 : 1);
      }
      break;
    }
  }
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y + 8, w, 16);
  ctx.fillRect(x + w * 0.15, y, w * 0.5, 10);
  ctx.fillRect(x + w * 0.55, y + 4, w * 0.3, 8);
}

function drawDirt(ctx: CanvasRenderingContext2D, env: EnvironmentDef): void {
  const rng = createRng(`dirt_${env.id}`);
  // Depth bands get darker
  const bands = 4;
  const depth = WORLD_H - GROUND_Y;
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = mix(env.palette.dirt, env.palette.dirtDark, i / (bands - 1));
    ctx.fillRect(0, GROUND_Y + (depth * i) / bands, WORLD_W, depth / bands + 1);
  }
  // Speckles: pebbles/roots/crystals texture
  for (let i = 0; i < 900; i++) {
    const x = rng.int(0, WORLD_W);
    const y = rng.int(GROUND_Y + 8, WORLD_H - 4);
    ctx.fillStyle = rng.chance(0.7) ? env.palette.dirtSpeckle : env.palette.dirtDark;
    ctx.fillRect(x, y, rng.int(2, 4), rng.int(2, 3));
  }
}

function drawSurfaceStrip(ctx: CanvasRenderingContext2D, env: EnvironmentDef): void {
  ctx.fillStyle = env.palette.surface;
  ctx.fillRect(0, GROUND_Y - 10, WORLD_W, 12);
  const rng = createRng(`surface_${env.id}`);
  // grass blades / sand bumps / snow lumps
  for (let x = 0; x < WORLD_W; x += rng.int(10, 26)) {
    ctx.fillRect(x, GROUND_Y - 14, 3, 5);
  }
}

/** The aboveground structure sits centered, feet on the ground line. */
function drawStructure(ctx: CanvasRenderingContext2D, env: EnvironmentDef): void {
  const p = env.palette;
  const cx = WORLD_W / 2;
  const g = GROUND_Y - 8; // visual ground line
  switch (env.structure) {
    case 'house': {
      ctx.fillStyle = p.structureMain;
      ctx.fillRect(cx - 130, g - 150, 260, 150);
      ctx.fillStyle = p.structureDark;
      ctx.fillRect(cx - 130, g - 80, 260, 6); // story line
      ctx.fillStyle = p.structureRoof;
      for (let i = 0; i < 5; i++) ctx.fillRect(cx - 150 + i * 12, g - 190 + i * 8, 300 - i * 24, 10);
      window_(ctx, cx - 100, g - 135, 34, 28);
      window_(ctx, cx + 60, g - 135, 34, 28);
      window_(ctx, cx - 100, g - 62, 34, 30);
      window_(ctx, cx + 60, g - 62, 34, 30);
      door(ctx, p, cx - 16, g);
      break;
    }
    case 'cabin': {
      ctx.fillStyle = p.structureMain;
      ctx.fillRect(cx - 110, g - 110, 220, 110);
      ctx.fillStyle = p.structureDark;
      for (let y = g - 100; y < g; y += 18) ctx.fillRect(cx - 110, y, 220, 4); // log lines
      ctx.fillStyle = p.structureRoof;
      for (let i = 0; i < 6; i++) ctx.fillRect(cx - 130 + i * 22, g - 130 - i * 12, 260 - i * 44, 14);
      window_(ctx, cx + 40, g - 80, 30, 26);
      door(ctx, p, cx - 60, g);
      // chimney + smoke
      ctx.fillStyle = p.structureDark;
      ctx.fillRect(cx + 60, g - 170, 18, 60);
      ctx.fillStyle = 'rgba(230,230,230,0.8)';
      ctx.fillRect(cx + 64, g - 186, 10, 8);
      ctx.fillRect(cx + 70, g - 198, 12, 8);
      break;
    }
    case 'shack': {
      // beach shack on stilts
      ctx.fillStyle = p.structureDark;
      ctx.fillRect(cx - 70, g - 30, 10, 30);
      ctx.fillRect(cx + 60, g - 30, 10, 30);
      ctx.fillStyle = p.structureMain;
      ctx.fillRect(cx - 90, g - 110, 180, 80);
      ctx.fillStyle = p.structureRoof;
      ctx.fillRect(cx - 104, g - 126, 208, 18);
      window_(ctx, cx - 60, g - 92, 30, 24);
      door(ctx, p, cx + 20, g - 30);
      // surfboard
      ctx.fillStyle = p.structureRoof;
      ctx.fillRect(cx - 130, g - 46, 10, 46);
      break;
    }
    case 'dome': {
      // stepped research dome
      ctx.fillStyle = p.structureMain;
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        const w = 220 - i * 34;
        ctx.fillRect(cx - w / 2, g - 24 - (i + 1) * 20, w, 22);
      }
      ctx.fillStyle = p.structureRoof;
      ctx.fillRect(cx - 110, g - 24, 220, 24); // base ring
      window_(ctx, cx - 20, g - 90, 40, 26);
      // antenna
      ctx.fillStyle = p.structureDark;
      ctx.fillRect(cx - 2, g - 170, 4, 40);
      ctx.fillStyle = '#ff5555';
      ctx.fillRect(cx - 3, g - 176, 6, 6);
      door(ctx, p, cx - 16, g);
      break;
    }
    case 'tower': {
      // tapered adobe tower
      ctx.fillStyle = p.structureMain;
      ctx.fillRect(cx - 70, g - 70, 140, 70);
      ctx.fillRect(cx - 55, g - 130, 110, 60);
      ctx.fillRect(cx - 40, g - 180, 80, 50);
      ctx.fillStyle = p.structureDark;
      ctx.fillRect(cx - 70, g - 74, 140, 6);
      ctx.fillRect(cx - 55, g - 134, 110, 6);
      window_(ctx, cx - 14, g - 168, 28, 20);
      window_(ctx, cx - 40, g - 116, 24, 20);
      door(ctx, p, cx - 14, g);
      // flag
      ctx.fillStyle = p.structureRoof;
      ctx.fillRect(cx - 2, g - 210, 3, 30);
      ctx.fillRect(cx + 1, g - 210, 24, 12);
      break;
    }
  }
}

function window_(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = '#2c3947';
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = '#9fd8ff';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#2c3947';
  ctx.fillRect(x + w / 2 - 1, y, 2, h);
  ctx.fillRect(x, y + h / 2 - 1, w, 2);
}

function door(ctx: CanvasRenderingContext2D, p: EnvironmentDef['palette'], x: number, groundY: number): void {
  ctx.fillStyle = p.structureDark;
  ctx.fillRect(x - 3, groundY - 55, 38, 55);
  ctx.fillStyle = p.structureRoof;
  ctx.fillRect(x, groundY - 52, 32, 52);
  ctx.fillStyle = '#ffe28a';
  ctx.fillRect(x + 24, groundY - 30, 4, 4); // knob
}

/** Secret hatch + ladder from the structure down into the first dirt row. */
function drawHatch(ctx: CanvasRenderingContext2D, env: EnvironmentDef): void {
  const cx = WORLD_W / 2 + 90;
  ctx.fillStyle = env.palette.structureDark;
  ctx.fillRect(cx - 16, GROUND_Y - 8, 32, 8); // hatch lid
  ctx.fillStyle = '#3a3f45';
  ctx.fillRect(cx - 10, GROUND_Y, 20, ART_CELL); // shaft into dirt
  ctx.fillStyle = '#8a9097';
  for (let y = GROUND_Y + 6; y < GROUND_Y + ART_CELL - 2; y += 10) {
    ctx.fillRect(cx - 7, y, 14, 3); // rungs
  }
}

/** Blends two #rrggbb colors. t in [0,1]. */
function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sa: number, sb: number) => Math.round(sa + (sb - sa) * t);
  const rr = ch((pa >> 16) & 255, (pb >> 16) & 255);
  const gg = ch((pa >> 8) & 255, (pb >> 8) & 255);
  const bb = ch(pa & 255, pb & 255);
  return `rgb(${rr},${gg},${bb})`;
}
