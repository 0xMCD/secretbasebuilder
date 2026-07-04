/**
 * The Canvas2D renderer. One rAF loop, redraws only when dirty.
 * Draw order (see docs/ARCHITECTURE.md): environment → module sprites →
 * connection seams → ghost preview → grid hint → selection → label overlay.
 */
import { ART_CELL, COLS, GROUND_ROW, ROWS, allSeams, canPlace, placementRect } from '../core/grid';
import { getDef, getEnvironment, getTheme, KINDS } from '../core/catalog';
import type { DefId, Placement, ThemeId } from '../core/types';
import { getState, subscribe } from '../core/store';
import { createCamera, WORLD_H, WORLD_W, type Camera } from './camera';
import { getSprite, initSprites } from './sprites';
import { drawDayNight, drawWeather, getEnvironmentCanvas } from './environment';
import { drawAgents, updateAgents } from './agents';

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
let lastFrame = startTime;

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
  const dt = Math.min(0.1, (now - lastFrame) / 1000); // clamp tab-sleep jumps
  lastFrame = now;

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

  // Static environment is cached at a lower logical resolution; the stretch
  // to world size is nearest-neighbor so it stays crisp pixel art.
  c.drawImage(getEnvironmentCanvas(env), 0, 0, WORLD_W, WORLD_H);
  drawWeather(c, env, t);
  // Night falls BEFORE rooms are drawn, so the base stays warm and lit
  // against the dark — lights-on-at-night is the whole vibe.
  drawDayNight(c, env, t);

  // Layered draw: rooms → seams → decor props → inhabitants → ghost.
  const livePlacements = ghost?.moveId
    ? state.placements.filter((p) => p.id !== ghost!.moveId)
    : state.placements;
  const roomPlacements = livePlacements.filter((p) => getDef(p.defId)?.layer !== 'decor');
  const decorPlacements = livePlacements.filter((p) => getDef(p.defId)?.layer === 'decor');

  for (const p of roomPlacements) drawPlacementSprite(c, p, now);
  drawConnectors(c, roomPlacements);
  for (const p of decorPlacements) drawPlacementSprite(c, p, now);
  updateAgents(roomPlacements, dt);
  drawAgents(c);
  if (ghost) {
    drawGridHint(c);
    drawGhost(c);
  }
  c.restore();

  // --- screen space ---
  drawSelection(c, cam);
  if (state.overlayOn) drawLabels(c, cam);
}

/** One placement sprite, with the landing "pop" animation for new arrivals. */
function drawPlacementSprite(c: CanvasRenderingContext2D, p: Placement, now: number): void {
  const def = getDef(p.defId);
  if (!def) return;
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

/**
 * Doorway/ladder connectors wherever two modules share an edge.
 * Deliberately quiet: a slim arched opening cut into the shared wall, not a
 * framed box — the rooms should read as connected, not decorated.
 * Special case: two stacked VERTICAL CONNECTORS (elevator/stairs/ladder —
 * kinds tagged "vertical") merge into one continuous open shaft.
 */
const SEAM_DARK = 'rgba(13,16,20,0.88)';
const SEAM_EDGE = 'rgba(255,255,255,0.14)';
const SEAM_GLOW = 'rgba(255,214,140,0.5)';

const VERTICAL_KINDS = new Set(
  KINDS.filter((k) => k.tags.includes('vertical')).map((k) => k.id),
);

function isVerticalConnector(placements: Placement[], id: string): boolean {
  const p = placements.find((pl) => pl.id === id);
  const def = p && getDef(p.defId);
  return !!def && VERTICAL_KINDS.has(def.kind);
}

/** Pure connector pass over ART_CELL world space — also used by snapshot export. */
export function drawConnectors(c: CanvasRenderingContext2D, placements: Placement[]): void {
  for (const seam of allSeams(placements)) {
    // All seam geometry derives from ART_CELL so resolution bumps never
    // require retuning (u = 1/128th of a cell).
    const u = ART_CELL / 128;
    if (seam.orientation === 'vertical') {
      // ONE arched doorway per seam, at the floor line of the seam's bottom
      // row — rooms connect where you'd walk through, nowhere else.
      const x = seam.x * ART_CELL;
      const yTop = (seam.y + seam.len - 1) * ART_CELL;
      const yFloor = yTop + ART_CELL - 24 * u;
      const doorH = 68 * u;
      c.fillStyle = SEAM_DARK;
      c.fillRect(x - 10 * u, yFloor - doorH + 12 * u, 20 * u, doorH - 12 * u);
      c.fillRect(x - 8 * u, yFloor - doorH + 6 * u, 16 * u, 6 * u); // arch steps
      c.fillRect(x - 6 * u, yFloor - doorH, 12 * u, 6 * u);
      c.fillStyle = SEAM_EDGE;
      c.fillRect(x - 12 * u, yFloor - doorH + 12 * u, 2 * u, doorH - 12 * u); // jambs
      c.fillRect(x + 10 * u, yFloor - doorH + 12 * u, 2 * u, doorH - 12 * u);
      c.fillStyle = SEAM_GLOW;
      c.fillRect(x - 2 * u, yFloor - doorH + 8 * u, 4 * u, 4 * u); // doorway lamp
    } else if (
      isVerticalConnector(placements, seam.aId) &&
      isVerticalConnector(placements, seam.bId)
    ) {
      // Stacked shafts MERGE: erase the shared floor/ceiling band and repaint
      // the shaft interior (theme-matched, top/bottom halves) so the two
      // segments read as one continuous shaft, then re-draw the continuity
      // elements (ladder rungs / elevator cables) across the joint.
      const a = placements.find((p) => p.id === seam.aId)!;
      const b = placements.find((p) => p.id === seam.bId)!;
      const upper = a.y < b.y ? a : b;
      const lower = upper === a ? b : a;
      const upPal = getTheme(upper.theme)!.palette;
      const loPal = getTheme(lower.theme)!.palette;
      const y = seam.y * ART_CELL;
      const inset = 22 * u; // stay inside both modules' side walls
      const x0 = seam.x * ART_CELL + inset;
      const w = seam.len * ART_CELL - 2 * inset;
      const reach = 52 * u; // covers wall + floor band + ceiling shadow
      c.fillStyle = upPal.roomBg;
      c.fillRect(x0, y - reach, w, reach);
      c.fillStyle = loPal.roomBg;
      c.fillRect(x0, y, w, reach);
      // subtle inner shading at the shaft sides
      c.fillStyle = 'rgba(0,0,0,0.2)';
      c.fillRect(x0, y - reach, 4 * u, reach * 2);
      c.fillRect(x0 + w - 4 * u, y - reach, 4 * u, reach * 2);
      const kind = getDef(lower.defId)?.kind;
      const cxm = seam.x * ART_CELL + (seam.len * ART_CELL) / 2;
      if (kind === 'ladder') {
        // rails + rungs continue straight through the joint
        for (const [pal2, y0] of [
          [upPal, y - reach],
          [loPal, y],
        ] as const) {
          c.fillStyle = pal2.trim;
          c.fillRect(cxm - 20, y0, 6, reach);
          c.fillRect(cxm + 14, y0, 6, reach);
        }
        for (let ry = y - reach + 10; ry < y + reach - 8; ry += 24) {
          c.fillStyle = (ry < y ? upPal : loPal).furniture;
          c.fillRect(cxm - 16, ry, 32, 5);
        }
      } else if (kind === 'elevator') {
        // cables run through; rails live outside the cover and stay intact
        c.fillStyle = upPal.furnitureDark;
        c.fillRect(cxm - 8, y - reach, 4, reach);
        c.fillRect(cxm + 4, y - reach, 4, reach);
        c.fillStyle = loPal.furnitureDark;
        c.fillRect(cxm - 8, y, 4, reach);
        c.fillRect(cxm + 4, y, 4, reach);
      }
      // stairs need nothing extra: the open well reads on its own
    } else {
      // Slim ladderway through the floor at the middle of the overlap.
      const hx = Math.round((seam.x + seam.len / 2) * ART_CELL);
      const y = seam.y * ART_CELL;
      c.fillStyle = SEAM_DARK;
      c.fillRect(hx - 16 * u, y - 24 * u, 32 * u, 48 * u);
      c.fillStyle = SEAM_EDGE;
      for (let ry = y - 16 * u; ry < y + 20 * u; ry += 12 * u) {
        c.fillRect(hx - 10 * u, ry, 20 * u, 2 * u); // rungs
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
