/**
 * Draws everything that isn't a module. Split for performance + vibes:
 *   - getEnvironmentCanvas(): STATIC layers (sky, sun/moon, dirt + buried
 *     easter eggs, surface, structure, hatch) cached per environment.
 *   - drawWeather(): ANIMATED overlay (drifting clouds, falling rain,
 *     floating snow, twinkling stars) drawn fresh each frame with time t.
 * One environment = structure + weather + dirt bundle (see environments.json).
 */
import { ART_CELL, COLS, GROUND_ROW, ROWS } from '../core/grid';
import type { EnvironmentDef } from '../core/types';
import { createRng } from './procedural/rng';

/**
 * Environment art is authored in a 64px-per-cell LOGICAL space and upscaled
 * to ART_CELL at draw time (nearest-neighbor, so it stays crisp). This keeps
 * the cached world canvas at ~20MB instead of ~80MB — module sprites are
 * where the high-detail budget goes.
 */
const LCELL = 64;
export const ENV_SCALE = ART_CELL / LCELL;
const WORLD_W = COLS * LCELL;
const GROUND_Y = GROUND_ROW * LCELL;
const WORLD_H = ROWS * LCELL;

// --- static layer (cached) ---

const envCache = new Map<string, HTMLCanvasElement>();

export function getEnvironmentCanvas(env: EnvironmentDef): HTMLCanvasElement {
  const hit = envCache.get(env.id);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = WORLD_W;
  canvas.height = WORLD_H;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  drawSky(ctx, env);
  drawCelestialBody(ctx, env);
  drawDirt(ctx, env);
  drawSurfaceStrip(ctx, env);
  drawStructure(ctx, env);
  drawHatch(ctx, env);
  envCache.set(env.id, canvas);
  return canvas;
}

function drawSky(ctx: CanvasRenderingContext2D, env: EnvironmentDef): void {
  const bands = 8;
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = mix(env.palette.skyTop, env.palette.skyBottom, i / (bands - 1));
    ctx.fillRect(0, (GROUND_Y * i) / bands, WORLD_W, GROUND_Y / bands + 1);
  }
}

function drawCelestialBody(ctx: CanvasRenderingContext2D, env: EnvironmentDef): void {
  if (env.weather === 'sunny') {
    // soft halo
    ctx.fillStyle = 'rgba(255,226,138,0.25)';
    ctx.fillRect(WORLD_W - 272, 28, 80, 80);
    ctx.fillStyle = '#ffe28a';
    ctx.fillRect(WORLD_W - 260, 40, 56, 56);
    ctx.fillStyle = '#fff3c2';
    ctx.fillRect(WORLD_W - 248, 52, 32, 32);
  } else if (env.weather === 'night') {
    ctx.fillStyle = 'rgba(244,241,222,0.18)';
    ctx.fillRect(WORLD_W - 312, 38, 68, 68);
    ctx.fillStyle = '#f4f1de';
    ctx.fillRect(WORLD_W - 300, 50, 44, 44);
    ctx.fillStyle = mix(env.palette.skyTop, '#000000', 0.15);
    ctx.fillRect(WORLD_W - 288, 58, 20, 20);
  }
}

function drawDirt(ctx: CanvasRenderingContext2D, env: EnvironmentDef): void {
  const rng = createRng(`dirt_${env.id}`);
  const bands = 4;
  const depth = WORLD_H - GROUND_Y;
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = mix(env.palette.dirt, env.palette.dirtDark, i / (bands - 1));
    ctx.fillRect(0, GROUND_Y + (depth * i) / bands, WORLD_W, depth / bands + 1);
  }
  for (let i = 0; i < 900; i++) {
    const x = rng.int(0, WORLD_W);
    const y = rng.int(GROUND_Y + 8, WORLD_H - 4);
    ctx.fillStyle = rng.chance(0.7) ? env.palette.dirtSpeckle : env.palette.dirtDark;
    ctx.fillRect(x, y, rng.int(2, 4), rng.int(2, 3));
  }
  drawEasterEggs(ctx, rng);
}

/** Buried secrets kids can spot while scrolling: gems, old bones, worms. */
function drawEasterEggs(ctx: CanvasRenderingContext2D, rng: ReturnType<typeof createRng>): void {
  const GEM_COLORS = ['#7fd4ff', '#ff8fdc', '#a5ff9e', '#ffd77f', '#c9a5ff'];
  for (let i = 0; i < 16; i++) {
    const x = rng.int(30, WORLD_W - 30);
    const y = rng.int(GROUND_Y + 60, WORLD_H - 30);
    const kind = rng.int(0, 2);
    if (kind === 0) {
      // gem cluster: stepped diamonds
      const c = GEM_COLORS[rng.int(0, GEM_COLORS.length - 1)];
      for (let g = 0; g < rng.int(2, 3); g++) {
        const gx = x + g * 9;
        const gy = y + rng.int(-4, 4);
        ctx.fillStyle = c;
        ctx.fillRect(gx + 3, gy, 4, 10);
        ctx.fillRect(gx, gy + 3, 10, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(gx + 4, gy + 2, 2, 2); // sparkle
      }
    } else if (kind === 1) {
      // old bone
      ctx.fillStyle = '#e8e2d0';
      ctx.fillRect(x, y + 3, 18, 4);
      ctx.fillRect(x - 2, y, 5, 5);
      ctx.fillRect(x - 2, y + 5, 5, 5);
      ctx.fillRect(x + 15, y, 5, 5);
      ctx.fillRect(x + 15, y + 5, 5, 5);
    } else {
      // worm buddy
      ctx.fillStyle = '#e88aa0';
      for (let s = 0; s < 5; s++) {
        ctx.fillRect(x + s * 4, y + (s % 2 === 0 ? 0 : 3), 5, 5);
      }
      ctx.fillStyle = '#472531';
      ctx.fillRect(x + 1, y + 1, 2, 2); // eye
    }
  }
}

function drawSurfaceStrip(ctx: CanvasRenderingContext2D, env: EnvironmentDef): void {
  ctx.fillStyle = env.palette.surface;
  ctx.fillRect(0, GROUND_Y - 10, WORLD_W, 12);
  const rng = createRng(`surface_${env.id}`);
  for (let x = 0; x < WORLD_W; x += rng.int(10, 26)) {
    ctx.fillRect(x, GROUND_Y - 14, 3, 5);
  }
}

/** The aboveground structure sits centered, feet on the ground line. */
function drawStructure(ctx: CanvasRenderingContext2D, env: EnvironmentDef): void {
  const p = env.palette;
  const cx = WORLD_W / 2;
  const g = GROUND_Y - 8;
  switch (env.structure) {
    case 'house': {
      ctx.fillStyle = p.structureMain;
      ctx.fillRect(cx - 130, g - 150, 260, 150);
      ctx.fillStyle = p.structureDark;
      ctx.fillRect(cx - 130, g - 80, 260, 6);
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
      for (let y = g - 100; y < g; y += 18) ctx.fillRect(cx - 110, y, 220, 4);
      ctx.fillStyle = p.structureRoof;
      for (let i = 0; i < 6; i++) ctx.fillRect(cx - 130 + i * 22, g - 130 - i * 12, 260 - i * 44, 14);
      window_(ctx, cx + 40, g - 80, 30, 26);
      door(ctx, p, cx - 60, g);
      ctx.fillStyle = p.structureDark;
      ctx.fillRect(cx + 60, g - 170, 18, 60);
      ctx.fillStyle = 'rgba(230,230,230,0.8)';
      ctx.fillRect(cx + 64, g - 186, 10, 8);
      ctx.fillRect(cx + 70, g - 198, 12, 8);
      break;
    }
    case 'shack': {
      ctx.fillStyle = p.structureDark;
      ctx.fillRect(cx - 70, g - 30, 10, 30);
      ctx.fillRect(cx + 60, g - 30, 10, 30);
      ctx.fillStyle = p.structureMain;
      ctx.fillRect(cx - 90, g - 110, 180, 80);
      ctx.fillStyle = p.structureRoof;
      ctx.fillRect(cx - 104, g - 126, 208, 18);
      window_(ctx, cx - 60, g - 92, 30, 24);
      door(ctx, p, cx + 20, g - 30);
      ctx.fillStyle = p.structureRoof;
      ctx.fillRect(cx - 130, g - 46, 10, 46);
      break;
    }
    case 'dome': {
      ctx.fillStyle = p.structureMain;
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        const w = 220 - i * 34;
        ctx.fillRect(cx - w / 2, g - 24 - (i + 1) * 20, w, 22);
      }
      ctx.fillStyle = p.structureRoof;
      ctx.fillRect(cx - 110, g - 24, 220, 24);
      window_(ctx, cx - 20, g - 90, 40, 26);
      ctx.fillStyle = p.structureDark;
      ctx.fillRect(cx - 2, g - 170, 4, 40);
      ctx.fillStyle = '#ff5555';
      ctx.fillRect(cx - 3, g - 176, 6, 6);
      door(ctx, p, cx - 16, g);
      break;
    }
    case 'tower': {
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
  ctx.fillRect(x + 24, groundY - 30, 4, 4);
}

/** Secret hatch + ladder from the structure down into the first dirt row. */
function drawHatch(ctx: CanvasRenderingContext2D, env: EnvironmentDef): void {
  const cx = WORLD_W / 2 + 90;
  ctx.fillStyle = env.palette.structureDark;
  ctx.fillRect(cx - 16, GROUND_Y - 8, 32, 8);
  ctx.fillStyle = '#3a3f45';
  ctx.fillRect(cx - 10, GROUND_Y, 20, LCELL);
  ctx.fillStyle = '#8a9097';
  for (let y = GROUND_Y + 6; y < GROUND_Y + LCELL - 2; y += 10) {
    ctx.fillRect(cx - 7, y, 14, 3);
  }
}

// --- animated weather overlay (drawn every frame) ---

/** t = seconds since app start. Draws only above-ground effects. Caller's ctx
 * is in ART_CELL world space; weather is authored in the same logical 64
 * space as the static layers, so scale up internally. */
export function drawWeather(ctx: CanvasRenderingContext2D, env: EnvironmentDef, t: number): void {
  ctx.save();
  ctx.scale(ENV_SCALE, ENV_SCALE);
  drawWeatherLogical(ctx, env, t);
  ctx.restore();
}

function drawWeatherLogical(ctx: CanvasRenderingContext2D, env: EnvironmentDef, t: number): void {
  const rng = createRng(`weather_${env.id}`);
  switch (env.weather) {
    case 'sunny': {
      for (let i = 0; i < 5; i++) {
        const speed = 6 + rng.next() * 8;
        const baseX = rng.int(0, WORLD_W);
        const y = rng.int(30, 160);
        const w = rng.int(80, 150);
        const x = mod(baseX + t * speed, WORLD_W + 300) - 260;
        cloud(ctx, x, y, w, 'rgba(255,255,255,0.92)');
      }
      break;
    }
    case 'rain': {
      for (let i = 0; i < 7; i++) {
        const speed = 10 + rng.next() * 10;
        const x = mod(rng.int(0, WORLD_W) + t * speed, WORLD_W + 340) - 280;
        cloud(ctx, x, rng.int(20, 120), rng.int(120, 220), 'rgba(198,204,212,0.95)');
      }
      ctx.fillStyle = 'rgba(160,190,220,0.7)';
      for (let i = 0; i < 240; i++) {
        const x0 = rng.int(0, WORLD_W);
        const len = rng.int(6, 10);
        const span = GROUND_Y - 150;
        const y = 140 + mod(rng.int(0, span) + t * 340, span);
        ctx.fillRect(x0 - 1, y, 2, len);
      }
      break;
    }
    case 'snow': {
      for (let i = 0; i < 4; i++) {
        const x = mod(rng.int(0, WORLD_W) + t * 7, WORLD_W + 320) - 260;
        cloud(ctx, x, rng.int(20, 100), rng.int(120, 200), 'rgba(232,237,242,0.95)');
      }
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 200; i++) {
        const s = rng.chance(0.3) ? 3 : 2;
        const x0 = rng.int(0, WORLD_W);
        const span = GROUND_Y - 80;
        const y = 74 + mod(rng.int(0, span) + t * 42, span);
        const x = x0 + Math.sin(t * 1.5 + i) * 12;
        ctx.fillRect(x, y, s, s);
      }
      break;
    }
    case 'night': {
      for (let i = 0; i < 130; i++) {
        const x = rng.int(0, WORLD_W);
        const y = rng.int(10, GROUND_Y - 60);
        const big = rng.chance(0.2);
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + rng.next() * 1.6) + i));
        ctx.fillStyle = `rgba(255,255,255,${tw.toFixed(2)})`;
        ctx.fillRect(x, y, big ? 2 : 1, big ? 2 : 1);
      }
      break;
    }
  }
}

// --- day/night cycle ---

/** Seconds for a full day→night→day loop. */
const DAY_LENGTH = 120;

/** 0 = high noon … 1 = midnight. Starts at day so builders see their base. */
export function nightAmount(t: number): number {
  const c = (t % DAY_LENGTH) / DAY_LENGTH;
  return (1 - Math.cos(c * Math.PI * 2)) / 2;
}

/**
 * Darkens the world as night falls: the sky goes deep blue with stars and a
 * moon, the dirt dims gently — but rooms are drawn AFTER this pass, so the
 * base glows warm and lit against the night. Skips most of the effect for
 * always-night environments (desert), which are already dark.
 */
export function drawDayNight(ctx: CanvasRenderingContext2D, env: EnvironmentDef, t: number): void {
  const n = nightAmount(t);
  if (n < 0.03) return;
  ctx.save();
  ctx.scale(ENV_SCALE, ENV_SCALE);
  const alwaysNight = env.weather === 'night';
  ctx.fillStyle = `rgba(8, 12, 42, ${(alwaysNight ? 0.12 : 0.58) * n})`;
  ctx.fillRect(0, 0, WORLD_W, GROUND_Y);
  ctx.fillStyle = `rgba(8, 12, 42, ${0.22 * n})`;
  ctx.fillRect(0, GROUND_Y, WORLD_W, WORLD_H - GROUND_Y);
  if (!alwaysNight && n > 0.35) {
    const a = (n - 0.35) / 0.65;
    const rng = createRng(`nightsky_${env.id}`);
    for (let i = 0; i < 110; i++) {
      const big = rng.chance(0.2);
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.6 + rng.next() * 1.4) + i));
      ctx.fillStyle = `rgba(255,255,255,${(a * tw).toFixed(2)})`;
      ctx.fillRect(rng.int(0, WORLD_W), rng.int(8, GROUND_Y - 70), big ? 2 : 1, big ? 2 : 1);
    }
    // moon rises opposite where the sun sits
    ctx.globalAlpha = a;
    ctx.fillStyle = '#f4f1de';
    ctx.fillRect(220, 54, 40, 40);
    ctx.fillStyle = 'rgba(20,30,60,0.35)';
    ctx.fillRect(230, 62, 16, 16);
    ctx.globalAlpha = a * 0.16;
    ctx.fillStyle = '#f4f1de';
    ctx.fillRect(208, 42, 64, 64);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y + 8, w, 16);
  ctx.fillRect(x + w * 0.15, y, w * 0.5, 10);
  ctx.fillRect(x + w * 0.55, y + 4, w * 0.3, 8);
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
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
