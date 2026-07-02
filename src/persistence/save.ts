/**
 * Save format v1 + localStorage autosave + export/import.
 * Contract: docs/ARCHITECTURE.md → "Save format". Versioned: migrate, never break.
 */
import type { GameState, Placement, SaveFile, SaveFileV1 } from '../core/types';
import { getDef, getEnvironment, getTheme, DEFAULT_ENVIRONMENT } from '../core/catalog';
import { getState, subscribe } from '../core/store';
import { loadBase } from '../core/actions';

export const STORAGE_KEY = 'secret-base-builder:save:v1';

export function serialize(state: GameState): SaveFileV1 {
  return {
    version: 1,
    baseName: state.baseName,
    environmentId: state.environmentId,
    placements: state.placements.map(({ id, defId, theme, x, y }) => ({
      id,
      defId,
      theme,
      x,
      y,
    })),
  };
}

export interface DeserializeResult {
  save: SaveFileV1;
  /** Placements dropped because their defId/theme no longer exists or data was malformed. */
  skipped: number;
}

/** Parses and sanitizes a save file. Throws on unusable input. */
export function deserialize(json: string): DeserializeResult {
  const raw: unknown = JSON.parse(json);
  if (typeof raw !== 'object' || raw === null) throw new Error('Save file is not an object');
  const file = raw as Partial<SaveFile>;
  if (file.version !== 1) throw new Error(`Unsupported save version: ${String(file.version)}`);

  const environmentId = getEnvironment(String(file.environmentId))
    ? String(file.environmentId)
    : DEFAULT_ENVIRONMENT;

  let skipped = 0;
  const placements: Placement[] = [];
  const seenIds = new Set<string>();
  for (const p of Array.isArray(file.placements) ? file.placements : []) {
    const ok =
      p &&
      typeof p.id === 'string' &&
      !seenIds.has(p.id) &&
      typeof p.defId === 'string' &&
      getDef(p.defId) !== undefined &&
      typeof p.theme === 'string' &&
      getTheme(p.theme) !== undefined &&
      Number.isInteger(p.x) &&
      Number.isInteger(p.y);
    if (ok) {
      seenIds.add(p.id);
      placements.push({ id: p.id, defId: p.defId, theme: p.theme, x: p.x, y: p.y });
    } else {
      skipped++;
    }
  }

  return {
    save: {
      version: 1,
      baseName: typeof file.baseName === 'string' && file.baseName ? file.baseName : 'My Secret Base',
      environmentId,
      placements,
    },
    skipped,
  };
}

// --- localStorage autosave ---

const AUTOSAVE_DEBOUNCE_MS = 400;
let autosaveTimer: ReturnType<typeof setTimeout> | undefined;

/** Starts debounced autosave; returns an unsubscribe/cleanup function. */
export function startAutosave(storage: Pick<Storage, 'setItem'> = localStorage): () => void {
  const unsubscribe = subscribe(() => {
    clearTimeout(autosaveTimer);
    // Nothing to save while the start screen is up — otherwise starting over
    // would immediately re-write the autosave it just cleared.
    if (getState().needsEnvironmentPick) return;
    autosaveTimer = setTimeout(() => {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(serialize(getState())));
      } catch {
        // Storage full/unavailable — autosave is best-effort.
      }
    }, AUTOSAVE_DEBOUNCE_MS);
  });
  return () => {
    unsubscribe();
    clearTimeout(autosaveTimer);
  };
}

/** Deletes the autosave (start-over flow). */
export function clearAutosave(storage: Pick<Storage, 'removeItem'> = localStorage): void {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable — nothing to clear.
  }
}

/** Loads the autosave into the store. Returns true if one existed and loaded. */
export function loadAutosave(storage: Pick<Storage, 'getItem'> = localStorage): boolean {
  try {
    const json = storage.getItem(STORAGE_KEY);
    if (!json) return false;
    const { save } = deserialize(json);
    loadBase(save.baseName, save.environmentId, save.placements);
    return true;
  } catch {
    return false;
  }
}

// --- export / import (browser only) ---

export function exportBase(): void {
  const save = serialize(getState());
  const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${save.baseName.replace(/[^a-z0-9-_ ]/gi, '').trim() || 'secret-base'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Imports a save file's text. Returns skipped-placement count. Throws if unusable. */
export function importBase(json: string): number {
  const { save, skipped } = deserialize(json);
  loadBase(save.baseName, save.environmentId, save.placements);
  return skipped;
}
