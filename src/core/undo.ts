/**
 * Snapshot-based linear undo/redo over the *base content* (placements +
 * environment + name). UI state (selection, theme, overlay) is not undoable.
 */
import type { EnvironmentId, Placement } from './types';
import { getState, setState } from './store';

interface Snapshot {
  placements: Placement[];
  environmentId: EnvironmentId;
  baseName: string;
}

const MAX_DEPTH = 100;
let past: Snapshot[] = [];
let future: Snapshot[] = [];

function snapshot(): Snapshot {
  const s = getState();
  return {
    placements: s.placements.map((p) => ({ ...p })),
    environmentId: s.environmentId,
    baseName: s.baseName,
  };
}

/** Call BEFORE any undoable mutation. */
export function recordUndo(): void {
  past.push(snapshot());
  if (past.length > MAX_DEPTH) past.shift();
  future = [];
}

export function undo(): void {
  const prev = past.pop();
  if (!prev) return;
  future.push(snapshot());
  setState({ ...prev, selectedId: null });
}

export function redo(): void {
  const next = future.pop();
  if (!next) return;
  past.push(snapshot());
  setState({ ...next, selectedId: null });
}

export function canUndo(): boolean {
  return past.length > 0;
}

export function canRedo(): boolean {
  return future.length > 0;
}

/** Clears history (used on import/new-base and in tests). */
export function resetUndo(): void {
  past = [];
  future = [];
}
