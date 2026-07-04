import { beforeEach, describe, expect, it } from 'vitest';
import { getState, resetState } from './store';
import {
  clearBase,
  loadBase,
  moveModule,
  placeModule,
  removeModule,
  resizePlacement,
  setEnvironment,
  setPlacementTheme,
} from './actions';
import { canRedo, canUndo, redo, resetUndo, undo } from './undo';
import { deserialize, serialize } from '../persistence/save';
import { GROUND_ROW } from './grid';

const Y = GROUND_ROW + 2;

beforeEach(() => {
  resetState();
  resetUndo();
});

describe('placeModule', () => {
  it('places valid modules and rejects invalid ones', () => {
    expect(placeModule('bedroom_2x1', 'tech', 10, Y)).not.toBeNull();
    expect(placeModule('bedroom_2x1', 'cozy', 11, Y)).toBeNull(); // overlap
    expect(placeModule('bedroom_2x1', 'tech', 10, 0)).toBeNull(); // above ground
    expect(placeModule('nope_9x9', 'tech', 10, Y)).toBeNull(); // unknown def
    expect(placeModule('bedroom_2x1', 'nope', 20, Y)).toBeNull(); // unknown theme
    expect(getState().placements).toHaveLength(1);
  });
});

describe('moveModule / removeModule', () => {
  it('moves when valid, refuses when blocked', () => {
    const a = placeModule('bedroom_2x1', 'tech', 10, Y)!;
    placeModule('bedroom_2x1', 'tech', 14, Y);
    expect(moveModule(a.id, 20, Y)).toBe(true);
    expect(moveModule(a.id, 13, Y)).toBe(false); // would overlap second
    expect(getState().placements.find((p) => p.id === a.id)).toMatchObject({ x: 20, y: Y });
  });

  it('removes and clears selection', () => {
    const a = placeModule('kitchen_2x1', 'glam', 10, Y)!;
    expect(getState().selectedId).toBe(a.id);
    removeModule(a.id);
    expect(getState().placements).toHaveLength(0);
    expect(getState().selectedId).toBeNull();
  });
});

describe('setPlacementTheme / resizePlacement (inspector)', () => {
  it('restyles a placement and is undoable', () => {
    const a = placeModule('bedroom_2x1', 'tech', 10, Y)!;
    setPlacementTheme(a.id, 'glam');
    expect(getState().placements[0].theme).toBe('glam');
    setPlacementTheme(a.id, 'nope'); // unknown theme → ignored
    expect(getState().placements[0].theme).toBe('glam');
    undo();
    expect(getState().placements[0].theme).toBe('tech');
  });

  it('resizes within the same kind when the footprint fits', () => {
    const a = placeModule('bedroom_2x1', 'tech', 10, Y)!;
    expect(resizePlacement(a.id, 'bedroom_4x1')).toBe(true); // cols 10-13 free
    expect(getState().placements[0].defId).toBe('bedroom_4x1');
    expect(resizePlacement(a.id, 'bedroom_2x1')).toBe(true);
    // A kitchen on cols 12-13 now blocks growing back to 4 wide (cols 10-13).
    placeModule('kitchen_2x1', 'tech', 12, Y);
    expect(resizePlacement(a.id, 'bedroom_4x1')).toBe(false);
    expect(getState().placements[0].defId).toBe('bedroom_2x1');
  });

  it('refuses cross-kind swaps', () => {
    const a = placeModule('bedroom_2x1', 'tech', 10, Y)!;
    expect(resizePlacement(a.id, 'kitchen_2x1')).toBe(false);
    expect(getState().placements[0].defId).toBe('bedroom_2x1');
  });
});

describe('undo/redo', () => {
  it('round-trips place → undo → redo', () => {
    placeModule('bedroom_2x1', 'tech', 10, Y);
    expect(canUndo()).toBe(true);
    undo();
    expect(getState().placements).toHaveLength(0);
    expect(canRedo()).toBe(true);
    redo();
    expect(getState().placements).toHaveLength(1);
  });

  it('covers move, remove, clear, and environment change', () => {
    const a = placeModule('bedroom_2x1', 'tech', 10, Y)!;
    moveModule(a.id, 20, Y);
    setEnvironment('desert');
    clearBase();
    expect(getState().placements).toHaveLength(0);
    undo(); // un-clear
    expect(getState().placements).toHaveLength(1);
    undo(); // un-environment
    expect(getState().environmentId).not.toBe('desert');
    undo(); // un-move
    expect(getState().placements[0]).toMatchObject({ x: 10, y: Y });
    undo(); // un-place
    expect(getState().placements).toHaveLength(0);
    expect(canUndo()).toBe(false);
  });

  it('a new action clears the redo stack', () => {
    placeModule('bedroom_2x1', 'tech', 10, Y);
    undo();
    placeModule('kitchen_2x1', 'tech', 10, Y);
    expect(canRedo()).toBe(false);
  });
});

describe('save serialize/deserialize', () => {
  it('round-trips a base', () => {
    placeModule('bedroom_3x1', 'fantasy', 10, Y);
    placeModule('elevator_1x3', 'tech', 13, Y);
    setEnvironment('mountain');
    const json = JSON.stringify(serialize(getState()));
    const { save, skipped } = deserialize(json);
    expect(skipped).toBe(0);
    expect(save.environmentId).toBe('mountain');
    expect(save.placements).toHaveLength(2);
    expect(save.placements[0]).toMatchObject({ defId: 'bedroom_3x1', theme: 'fantasy' });
  });

  it('skips unknown defs/themes and malformed entries gracefully', () => {
    const json = JSON.stringify({
      version: 1,
      baseName: 'Test',
      environmentId: 'suburban',
      placements: [
        { id: 'ok', defId: 'bedroom_2x1', theme: 'tech', x: 10, y: Y },
        { id: 'bad-def', defId: 'jacuzzi_9x9', theme: 'tech', x: 10, y: Y },
        { id: 'bad-theme', defId: 'bedroom_2x1', theme: 'vaporwave', x: 10, y: Y },
        { id: 'bad-coord', defId: 'bedroom_2x1', theme: 'tech', x: 1.5, y: Y },
      ],
    });
    const { save, skipped } = deserialize(json);
    expect(save.placements).toHaveLength(1);
    expect(skipped).toBe(3);
  });

  it('rejects unsupported versions', () => {
    expect(() => deserialize('{"version":99}')).toThrow(/version/i);
  });

  it('falls back to default environment for unknown ids', () => {
    const { save } = deserialize('{"version":1,"environmentId":"moon","placements":[]}');
    expect(save.environmentId).toBe('suburban');
  });
});

describe('loadBase', () => {
  it('replaces content and clears undo history', () => {
    placeModule('bedroom_2x1', 'tech', 10, Y);
    loadBase('Imported', 'beach', [
      { id: 'x1', defId: 'gameroom_4x1', theme: 'glam', x: 5, y: Y },
    ]);
    const s = getState();
    expect(s.baseName).toBe('Imported');
    expect(s.environmentId).toBe('beach');
    expect(s.placements).toHaveLength(1);
    expect(canUndo()).toBe(false);
  });
});

describe('share codes', () => {
  it('round-trips a base through encode/decode', async () => {
    const { encodeShare, decodeShare } = await import('../persistence/share');
    placeModule('bedroom_2x1', 'tech', 10, Y);
    placeModule('silo_2x3', 'fantasy', 14, Y);
    const save = serialize(getState());
    const code = await encodeShare(save);
    expect(code.length).toBeLessThan(1200); // stays URL-friendly
    const { save: restored, skipped } = deserialize(await decodeShare(code));
    expect(skipped).toBe(0);
    expect(restored).toEqual(save);
  });

  it('rejects garbage codes', async () => {
    const { decodeShare } = await import('../persistence/share');
    await expect(decodeShare('xnotacode')).rejects.toThrow();
  });
});
