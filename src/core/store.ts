/**
 * Minimal observable store. React bridges via useSyncExternalStore
 * (src/ui/hooks.ts); the canvas renderer subscribes directly.
 */
import type { GameState } from './types';
import { DEFAULT_ENVIRONMENT, DEFAULT_THEME } from './catalog';

export type Listener = () => void;

export function initialState(): GameState {
  return {
    baseName: 'My Secret Base',
    environmentId: DEFAULT_ENVIRONMENT,
    placements: [],
    overlayOn: false,
    activeTheme: DEFAULT_THEME,
    selectedId: null,
    needsEnvironmentPick: true,
  };
}

let state: GameState = initialState();
const listeners = new Set<Listener>();

export function getState(): GameState {
  return state;
}

/** Shallow-merges a partial state and notifies subscribers. */
export function setState(partial: Partial<GameState>): void {
  state = { ...state, ...partial };
  for (const l of listeners) l();
}

/** Test-only: reset to a fresh state. */
export function resetState(next?: GameState): void {
  state = next ?? initialState();
  for (const l of listeners) l();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
