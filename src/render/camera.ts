/**
 * Camera: maps world art-pixel space to screen space.
 * screen = (world - offset) * zoom. Session-only, never saved.
 */
import { ART_CELL, COLS, GROUND_ROW, ROWS } from '../core/grid';

export const WORLD_W = COLS * ART_CELL;
export const WORLD_H = ROWS * ART_CELL;
const GROUND_Y = GROUND_ROW * ART_CELL;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 3;

export interface Camera {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

/** Default zoom: one grid cell ≈ 96 CSS px ≈ 1 inch — big and chunky. */
export const DEFAULT_ZOOM = 96 / ART_CELL;

export function createCamera(viewW: number, viewH: number): Camera {
  // Frame the hatch area: surface in the top third, building space below.
  const zoom = DEFAULT_ZOOM;
  const cam: Camera = {
    offsetX: WORLD_W / 2 - viewW / zoom / 2,
    offsetY: GROUND_Y - viewH / zoom * 0.34,
    zoom,
  };
  clampCamera(cam, viewW, viewH);
  return cam;
}

export function worldToScreen(cam: Camera, wx: number, wy: number): [number, number] {
  return [(wx - cam.offsetX) * cam.zoom, (wy - cam.offsetY) * cam.zoom];
}

export function screenToWorld(cam: Camera, sx: number, sy: number): [number, number] {
  return [sx / cam.zoom + cam.offsetX, sy / cam.zoom + cam.offsetY];
}

/** Grid cell under a screen point. May be out of bounds — caller checks. */
export function screenToCell(cam: Camera, sx: number, sy: number): [number, number] {
  const [wx, wy] = screenToWorld(cam, sx, sy);
  return [Math.floor(wx / ART_CELL), Math.floor(wy / ART_CELL)];
}

export function panBy(cam: Camera, dxScreen: number, dyScreen: number, viewW: number, viewH: number): void {
  cam.offsetX -= dxScreen / cam.zoom;
  cam.offsetY -= dyScreen / cam.zoom;
  clampCamera(cam, viewW, viewH);
}

/** Zooms keeping the world point under (sx, sy) fixed on screen. */
export function zoomAt(cam: Camera, sx: number, sy: number, factor: number, viewW: number, viewH: number): void {
  const [wx, wy] = screenToWorld(cam, sx, sy);
  cam.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, cam.zoom * factor));
  cam.offsetX = wx - sx / cam.zoom;
  cam.offsetY = wy - sy / cam.zoom;
  clampCamera(cam, viewW, viewH);
}

/** Keeps at least part of the world on screen (with a soft margin). */
export function clampCamera(cam: Camera, viewW: number, viewH: number): void {
  const margin = ART_CELL * 4;
  const minX = -viewW / cam.zoom + margin;
  const maxX = WORLD_W - margin;
  const minY = -viewH / cam.zoom + margin;
  const maxY = WORLD_H - margin;
  cam.offsetX = Math.min(maxX, Math.max(minX, cam.offsetX));
  cam.offsetY = Math.min(maxY, Math.max(minY, cam.offsetY));
}
