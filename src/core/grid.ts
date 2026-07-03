/**
 * World grid constants and pure placement math. Fully unit-tested; no DOM.
 * Coordinate contract: docs/design/gdd.json → "coordinateSystem".
 */
import type { ModuleDef, Placement } from './types';
import { getDef } from './catalog';

export const COLS = 48;
export const ROWS = 26;
/** First underground (buildable) row. Rows above are sky/surface. */
export const GROUND_ROW = 6;
/**
 * Art pixels per grid cell. All sprite dimensions derive from this.
 * 256 = the "high-fidelity" resolution (final art is authored at w*256 × h*256).
 */
export const ART_CELL = 256;

/** Max module footprint — keep in sync with scripts/validate-content.mjs. */
export const MAX_W = 6;
export const MAX_H = 3;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function placementRect(p: Placement): Rect | null {
  const def = getDef(p.defId);
  return def ? { x: p.x, y: p.y, w: def.w, h: def.h } : null;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function inBuildableRegion(r: Rect): boolean {
  return r.x >= 0 && r.x + r.w <= COLS && r.y >= GROUND_ROW && r.y + r.h <= ROWS;
}

/**
 * Can `def` be placed with its top-left at (x, y)?
 * `ignoreId` excludes a placement from collision checks (used while moving it).
 */
export function canPlace(
  placements: Placement[],
  def: ModuleDef,
  x: number,
  y: number,
  ignoreId?: string,
): boolean {
  const rect: Rect = { x, y, w: def.w, h: def.h };
  if (!inBuildableRegion(rect)) return false;
  for (const p of placements) {
    if (p.id === ignoreId) continue;
    const other = placementRect(p);
    if (other && rectsOverlap(rect, other)) return false;
  }
  return true;
}

/**
 * A seam where two placed modules touch: the renderer draws a doorway/opening
 * here, and (later) characters treat it as a walkable connection.
 * Coordinates are in grid cells; a vertical seam sits on the boundary line
 * x = `x` spanning rows [y, y+len); a horizontal seam sits on y = `y`
 * spanning cols [x, x+len).
 */
export interface Seam {
  orientation: 'vertical' | 'horizontal';
  x: number;
  y: number;
  len: number;
}

/** Shared-edge seam between two rects, or null if they don't touch edge-on. */
export function sharedSeam(a: Rect, b: Rect): Seam | null {
  // Vertical seam: a's right edge meets b's left edge (or vice versa).
  if (a.x + a.w === b.x || b.x + b.w === a.x) {
    const x = a.x + a.w === b.x ? b.x : a.x;
    const y0 = Math.max(a.y, b.y);
    const y1 = Math.min(a.y + a.h, b.y + b.h);
    if (y1 - y0 >= 1) return { orientation: 'vertical', x, y: y0, len: y1 - y0 };
  }
  // Horizontal seam: a's bottom edge meets b's top edge (or vice versa).
  if (a.y + a.h === b.y || b.y + b.h === a.y) {
    const y = a.y + a.h === b.y ? b.y : a.y;
    const x0 = Math.max(a.x, b.x);
    const x1 = Math.min(a.x + a.w, b.x + b.w);
    if (x1 - x0 >= 1) return { orientation: 'horizontal', x: x0, y, len: x1 - x0 };
  }
  return null;
}

/** A seam annotated with the two placements that share it. */
export interface PlacementSeam extends Seam {
  aId: string;
  bId: string;
}

/** All seams among the given placements (each pair reported once). */
export function allSeams(placements: Placement[]): PlacementSeam[] {
  const seams: PlacementSeam[] = [];
  for (let i = 0; i < placements.length; i++) {
    const a = placementRect(placements[i]);
    if (!a) continue;
    for (let j = i + 1; j < placements.length; j++) {
      const b = placementRect(placements[j]);
      if (!b) continue;
      const seam = sharedSeam(a, b);
      if (seam) seams.push({ ...seam, aId: placements[i].id, bId: placements[j].id });
    }
  }
  return seams;
}

/** Topmost placement whose rect contains the given cell, or null. */
export function placementAt(placements: Placement[], cx: number, cy: number): Placement | null {
  for (let i = placements.length - 1; i >= 0; i--) {
    const r = placementRect(placements[i]);
    if (r && cx >= r.x && cx < r.x + r.w && cy >= r.y && cy < r.y + r.h) {
      return placements[i];
    }
  }
  return null;
}
