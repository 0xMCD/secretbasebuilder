import { describe, expect, it } from 'vitest';
import {
  COLS,
  GROUND_ROW,
  ROWS,
  allSeams,
  canPlace,
  inBuildableRegion,
  placementAt,
  rectsOverlap,
  sharedSeam,
} from './grid';
import { MODULE_DEFS, getDef } from './catalog';
import type { Placement } from './types';

const bedroom2 = getDef('bedroom_2x1')!;
const garage = getDef('garage_4x2')!;

function place(defId: string, x: number, y: number, id = `${defId}@${x},${y}`): Placement {
  return { id, defId, theme: 'tech', x, y };
}

describe('catalog expansion', () => {
  it('expands kinds×sizes with stable ids', () => {
    expect(bedroom2).toMatchObject({ kind: 'bedroom', w: 2, h: 1 });
    expect(MODULE_DEFS.length).toBeGreaterThanOrEqual(25);
    const ids = new Set(MODULE_DEFS.map((d) => d.id));
    expect(ids.size).toBe(MODULE_DEFS.length);
  });
});

describe('rectsOverlap', () => {
  it('detects overlap and touching-is-not-overlap', () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 2, h: 1 }, { x: 1, y: 0, w: 2, h: 1 })).toBe(true);
    expect(rectsOverlap({ x: 0, y: 0, w: 2, h: 1 }, { x: 2, y: 0, w: 2, h: 1 })).toBe(false);
    expect(rectsOverlap({ x: 0, y: 0, w: 2, h: 1 }, { x: 0, y: 1, w: 2, h: 1 })).toBe(false);
  });
});

describe('inBuildableRegion', () => {
  it('rejects surface rows and out-of-bounds', () => {
    expect(inBuildableRegion({ x: 0, y: GROUND_ROW, w: 2, h: 1 })).toBe(true);
    expect(inBuildableRegion({ x: 0, y: GROUND_ROW - 1, w: 2, h: 1 })).toBe(false);
    expect(inBuildableRegion({ x: COLS - 1, y: GROUND_ROW, w: 2, h: 1 })).toBe(false);
    expect(inBuildableRegion({ x: 0, y: ROWS - 1, w: 1, h: 2 })).toBe(false);
  });
});

describe('canPlace', () => {
  it('rejects overlap, allows adjacency, honors ignoreId for moves', () => {
    const existing = [place('bedroom_2x1', 10, 8, 'a')];
    expect(canPlace(existing, bedroom2, 11, 8)).toBe(false);
    expect(canPlace(existing, bedroom2, 12, 8)).toBe(true);
    // Moving 'a' one cell right overlaps itself unless ignored.
    expect(canPlace(existing, bedroom2, 11, 8, 'a')).toBe(true);
  });

  it('handles multi-tall modules', () => {
    expect(canPlace([], garage, 0, ROWS - 2)).toBe(true);
    expect(canPlace([], garage, 0, ROWS - 1)).toBe(false);
  });
});

describe('seams (visual connection / walkability)', () => {
  it('finds a vertical seam between side-by-side rooms', () => {
    const seam = sharedSeam({ x: 10, y: 8, w: 2, h: 1 }, { x: 12, y: 8, w: 3, h: 1 });
    expect(seam).toEqual({ orientation: 'vertical', x: 12, y: 8, len: 1 });
  });

  it('finds a horizontal seam with partial overlap', () => {
    const seam = sharedSeam({ x: 10, y: 8, w: 4, h: 1 }, { x: 12, y: 9, w: 4, h: 1 });
    expect(seam).toEqual({ orientation: 'horizontal', x: 12, y: 9, len: 2 });
  });

  it('returns null for diagonal touch and for gaps', () => {
    expect(sharedSeam({ x: 0, y: 8, w: 2, h: 1 }, { x: 2, y: 9, w: 2, h: 1 })).toBeNull();
    expect(sharedSeam({ x: 0, y: 8, w: 2, h: 1 }, { x: 3, y: 8, w: 2, h: 1 })).toBeNull();
  });

  it('collects all seams pairwise', () => {
    const seams = allSeams([
      place('bedroom_2x1', 10, 8),
      place('bedroom_2x1', 12, 8),
      place('bedroom_2x1', 10, 9),
    ]);
    expect(seams).toHaveLength(2);
  });
});

describe('placementAt', () => {
  it('returns the topmost placement containing a cell', () => {
    const placements = [place('garage_4x2', 10, 8, 'g')];
    expect(placementAt(placements, 13, 9)?.id).toBe('g');
    expect(placementAt(placements, 14, 9)).toBeNull();
  });
});
