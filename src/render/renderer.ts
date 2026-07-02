/**
 * The Canvas2D renderer. One rAF loop, redraws only when dirty.
 * Draw order (see docs/ARCHITECTURE.md): environment → module sprites →
 * connection seams → ghost preview → grid hint → selection → label overlay.
 */
import { ART_CELL, COLS, GROUND_ROW, ROWS, allSeams, canPlace, placementRect } from '../core/grid';
import { getDef, getEnvironment } from '../core/catalog';
import type { DefId, ThemeId } from '../core/types';
import { getState, subscribe } from '../core/store';
import { createCamera, type Camera } from './camera';
import { getSprite, initSprites } from './sprites';
import { drawWeather, getEnvironmentCanvas } from './environment';

/** A module being placed (from sidebar) or moved (existing placement). */
export interface Ghost {
  defId: DefId;
  theme: ThemeId;
  cx: number;
  cy: number;
  /** When moving an existing placement: its id (hidden + ignored in collision). */
  moveId?: string;
}

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let camera: Camera | null = null;
let viewW = 0;
let viewH = 0;
let dpr = 1;
let ghost: Ghost | null = null;
let rafId = 0;
const startTime = performance.now();

/** "Pop" scale-in when a module lands. */
const POP_MS = 200;
const pops = new Map<string, number>(); // placement id → start time
let knownIds = new Set<string>();

/**
 * The loop renders every frame (weather and pops are always animating and the
 * static environment is a cached canvas, so frames are cheap). Kept so callers
 * don't need to know that; it's the hook if we ever gate on dirty again.
 */
export function requestRedraw(): void {}

export function getCamera(): Camera {
  return camera!;
}

export function getViewSize(): { w: number; h: number } {
  return { w: viewW, h: viewH };
}

export function setGhost(g: Ghost | null): void {
  ghost = g;
}

export function getGhost(): Ghost | null {
  return ghost;
}

export function initRenderer(el: HTMLCanvasElement): () => void {
  canvas = el;
  ctx = el.getContext('2d')!;

  const resize = () => {
    const rect = el.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    viewW = rect.width;
    viewH = rect.height;
    el.width = Math.round(rect.width * dpr);
    el.height = Math.round(rect.height * dpr);
    if (!camera) camera = createCamera(viewW, viewH);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();

  void initSprites(requestRedraw);
  const unsubscribe = subscribe(requestRedraw);
  knownIds = new Set(getState().placements.map((p) => p.id));

  const loop = () => {
    rafId = requestAnimationFrame(loop);
    if (camera) draw();
  };
  rafId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(rafId);
    ro.disconnect();
    unsubscribe();
    canvas = null;
    ctx = null;
    camera = null;
  };
}

function draw(): void {
  if (!ctx || !canvas || !camera) return;
  const c = ctx;
  const cam = camera;
  const state = getState();
  const env = getEnvironment(state.environmentId)!;
  const now = performance.now();
  const t = (now - startTime) / 1000;

  // Register pop animations for newly landed modules.
  for (const p of state.placements) {
    if (!knownIds.has(p.id)) pops.set(p.id, now);
  }
  knownIds = new Set(state.placements.map((p) => p.id));

  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.imageSmoothingEnabled = false;
  c.fillStyle = '#0b0e12';
  c.fillRect(0, 0, viewW, viewH);

  // --- world space ---
  c.save();
  c.scale(cam.zoom, cam.zoom);
  c.translate(-cam.offsetX, -cam.offsetY);

  c.drawImage(getEnvironmentCanvas(env), 0, 0);
  drawWeather(c, env, t);

  // Module sprites (skip the one being moved — its ghost is drawn instead)
  for (const p of state.placements) {
    if (ghost?.moveId === p.id) continue;
    const def = getDef(p.defId);
    if (!def) continue;
    const img = getSprite(def, p.theme).image;
    const pop = pops.get(p.id);
    if (pop !== undefined) {
      const e = (now - pop) / POP_MS;
      if (e >= 1) {
        pops.delete(p.id);
        c.drawImage(img, p.x * ART_CELL, p.y * ART_CELL);
      } else {
        // ease-out overshoot: scale 1.14 → 1 around the module center
        const s = 1 + 0.14 * (1 - e) * (1 - e);
        const cxm = (p.x + def.w / 2) * ART_CELL;
        const cym = (p.y + def.h / 2) * ART_CELL;
        c.save();
        c.translate(cxm, cym);
        c.scale(s, s);
        c.drawImage(img, (-def.w * ART_CELL) / 2, (-def.h * ART_CELL) / 2);
        c.restore();
      }
    } else {
      c.drawImage(img, p.x * ART_CELL, p.y * ART_CELL);
    }
  }

  drawSeams(c);
  if (ghost) {
    drawGridHint(c);
    drawGhost(c);
  }
  c.restore();

  // --- screen space ---
  drawSelection(c, cam);
  if (state.overlayOn) drawLabels(c, cam);
}

/**
 * Doorway/ladder connectors wherever two modules share an edge.
 * Deliberately quiet: a slim arched opening cut into the shared wall, not a
 * framed box — the rooms should read as connected, not decorated.
 */
const SEAM_DARK = 'rgba(13,16,20,0.88)';
const SEAM_EDGE = 'rgba(255,255,255,0.14)';
const SEAM_GLOW = 'rgba(255,214,140,0.5)';

function drawSeams(c: CanvasRenderingContext2D): void {
  const state = getState();
  const placements = ghost?.moveId
    ? state.placements.filter((p) => p.id !== ghost!.moveId)
    : state.placements;
  for (const seam of allSeams(placements)) {
    if (seam.orientation === 'vertical') {
      const x = seam.x * ART_CELL;
      for (let row = 0; row < seam.len; row++) {
        const yTop = (seam.y + row) * ART_CELL;
        if (row === seam.len - 1) {
          // Arched doorway rising from the floor line.
          const yFloor = yTop + ART_CELL - 12;
          const doorH = 34;
          c.fillStyle = SEAM_DARK;
          c.fillRect(x - 5, yFloor - doorH + 6, 10, doorH - 6);
          c.fillRect(x - 4, yFloor - doorH + 3, 8, 3); // arch steps
          c.fillRect(x - 3, yFloor - doorH, 6, 3);
          c.fillStyle = SEAM_EDGE;
          c.fillRect(x - 6, yFloor - doorH + 6, 1, doorH - 6); // whisper-thin jambs
          c.fillRect(x + 5, yFloor - doorH + 6, 1, doorH - 6);
          c.fillStyle = SEAM_GLOW;
          c.fillRect(x - 1, yFloor - doorH + 4, 2, 2); // tiny doorway lamp
        } else {
          // Small round pass-through window on upper rows.
          c.fillStyle = SEAM_DARK;
          c.fillRect(x - 4, yTop + 28, 8, 10);
          c.fillRect(x - 3, yTop + 26, 6, 2);
          c.fillRect(x - 3, yTop + 38, 6, 2);
        }
      }
    } else {
      // Slim ladderway through the floor at the middle of the overlap.
      const hx = Math.round((seam.x + seam.len / 2) * ART_CELL);
      const y = seam.y * ART_CELL;
      c.fillStyle = SEAM_DARK;
      c.fillRect(hx - 8, y - 12, 16, 24);
      c.fillStyle = SEAM_EDGE;
      for (let ry = y - 8; ry < y + 10; ry += 6) {
        c.fillRect(hx - 5, ry, 10, 1); // rungs
      }
    }
  }
}

function drawGhost(c: CanvasRenderingContext2D): void {
  if (!ghost) return;
  const def = getDef(ghost.defId);
  if (!def) return;
  const valid = canPlace(getState().placements, def, ghost.cx, ghost.cy, ghost.moveId);
  const x = ghost.cx * ART_CELL;
  const y = ghost.cy * ART_CELL;
  c.globalAlpha = 0.75;
  c.drawImage(getSprite(def, ghost.theme).image, x, y);
  c.globalAlpha = 0.28;
  c.fillStyle = valid ? '#3dff7a' : '#ff4a4a';
  c.fillRect(x, y, def.w * ART_CELL, def.h * ART_CELL);
  c.globalAlpha = 1;
}

/** Faint grid over the buildable region while placing/moving. */
function drawGridHint(c: CanvasRenderingContext2D): void {
  c.fillStyle = 'rgba(255,255,255,0.07)';
  for (let gx = 0; gx <= COLS; gx++) {
    c.fillRect(gx * ART_CELL, GROUND_ROW * ART_CELL, 1, (ROWS - GROUND_ROW) * ART_CELL);
  }
  for (let gy = GROUND_ROW; gy <= ROWS; gy++) {
    c.fillRect(0, gy * ART_CELL, COLS * ART_CELL, 1);
  }
  c.fillStyle = 'rgba(61,255,122,0.25)';
  c.fillRect(0, GROUND_ROW * ART_CELL, COLS * ART_CELL, 2);
}

function drawSelection(c: CanvasRenderingContext2D, cam: Camera): void {
  const { selectedId, placements } = getState();
  if (!selectedId || ghost?.moveId === selectedId) return;
  const p = placements.find((pl) => pl.id === selectedId);
  if (!p) return;
  const r = placementRect(p);
  if (!r) return;
  const sx = (r.x * ART_CELL - cam.offsetX) * cam.zoom;
  const sy = (r.y * ART_CELL - cam.offsetY) * cam.zoom;
  c.strokeStyle = '#ffd166';
  c.lineWidth = 2;
  c.setLineDash([6, 4]);
  c.strokeRect(sx - 2, sy - 2, r.w * ART_CELL * cam.zoom + 4, r.h * ART_CELL * cam.zoom + 4);
  c.setLineDash([]);
}

function drawLabels(c: CanvasRenderingContext2D, cam: Camera): void {
  const { placements } = getState();
  c.font = '600 12px system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (const p of placements) {
    const def = getDef(p.defId);
    if (!def) continue;
    const cx = ((p.x + def.w / 2) * ART_CELL - cam.offsetX) * cam.zoom;
    const cy = ((p.y + def.h / 2) * ART_CELL - cam.offsetY) * cam.zoom;
    if (cx < -80 || cx > viewW + 80 || cy < -40 || cy > viewH + 40) continue;
    const text = `${def.name} ${def.w}×${def.h}`;
    const w = c.measureText(text).width + 14;
    c.fillStyle = 'rgba(12,16,22,0.82)';
    c.fillRect(cx - w / 2, cy - 10, w, 20);
    c.strokeStyle = 'rgba(255,255,255,0.25)';
    c.lineWidth = 1;
    c.strokeRect(cx - w / 2 + 0.5, cy - 9.5, w - 1, 19);
    c.fillStyle = '#e8eef5';
    c.fillText(text, cx, cy + 1);
  }
}
