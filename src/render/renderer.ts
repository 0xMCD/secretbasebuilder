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
import { drawEnvironment } from './environment';

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
let dirty = true;
let ghost: Ghost | null = null;
let rafId = 0;

export function requestRedraw(): void {
  dirty = true;
}

export function getCamera(): Camera {
  return camera!;
}

export function getViewSize(): { w: number; h: number } {
  return { w: viewW, h: viewH };
}

export function setGhost(g: Ghost | null): void {
  ghost = g;
  dirty = true;
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
    dirty = true;
  };
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();

  void initSprites(requestRedraw);
  const unsubscribe = subscribe(requestRedraw);

  const loop = () => {
    rafId = requestAnimationFrame(loop);
    if (dirty && camera) {
      dirty = false;
      draw();
    }
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

  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.imageSmoothingEnabled = false;
  c.fillStyle = '#0b0e12';
  c.fillRect(0, 0, viewW, viewH);

  // --- world space ---
  c.save();
  c.scale(cam.zoom, cam.zoom);
  c.translate(-cam.offsetX, -cam.offsetY);

  drawEnvironment(c, env);

  // Module sprites (skip the one being moved — its ghost is drawn instead)
  for (const p of state.placements) {
    if (ghost?.moveId === p.id) continue;
    const def = getDef(p.defId);
    if (!def) continue;
    c.drawImage(getSprite(def, p.theme).image, p.x * ART_CELL, p.y * ART_CELL);
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

/** Doorway/ladder connectors wherever two modules share an edge. */
function drawSeams(c: CanvasRenderingContext2D): void {
  const state = getState();
  const placements = ghost?.moveId
    ? state.placements.filter((p) => p.id !== ghost!.moveId)
    : state.placements;
  for (const seam of allSeams(placements)) {
    if (seam.orientation === 'vertical') {
      const x = seam.x * ART_CELL;
      // Doorway on the bottom row of the seam; porthole windows on rows above.
      for (let row = 0; row < seam.len; row++) {
        const yTop = (seam.y + row) * ART_CELL;
        if (row === seam.len - 1) {
          const doorH = 38;
          const yFloor = yTop + ART_CELL - 12;
          c.fillStyle = '#23282e';
          c.fillRect(x - 7, yFloor - doorH, 14, doorH);
          c.fillStyle = '#9aa4ad';
          c.fillRect(x - 8, yFloor - doorH - 2, 16, 2);
          c.fillRect(x - 8, yFloor - doorH, 1, doorH);
          c.fillRect(x + 7, yFloor - doorH, 1, doorH);
        } else {
          c.fillStyle = '#23282e';
          c.fillRect(x - 6, yTop + 24, 12, 16);
          c.fillStyle = '#9aa4ad';
          c.fillRect(x - 7, yTop + 22, 14, 2);
          c.fillRect(x - 7, yTop + 40, 14, 2);
        }
      }
    } else {
      // Hatch + ladder through the floor/ceiling at the middle of the overlap.
      const hx = (seam.x + seam.len / 2) * ART_CELL;
      const y = seam.y * ART_CELL;
      c.fillStyle = '#23282e';
      c.fillRect(hx - 12, y - 14, 24, 28);
      c.fillStyle = '#9aa4ad';
      c.fillRect(hx - 13, y - 14, 2, 28);
      c.fillRect(hx + 11, y - 14, 2, 28);
      for (let ry = y - 10; ry < y + 12; ry += 7) {
        c.fillRect(hx - 8, ry, 16, 2);
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
