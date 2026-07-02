import { useSyncExternalStore } from 'react';
import { getState, subscribe } from '../core/store';
import type { GameState } from '../core/types';

/** Re-renders the component on any game-state change. */
export function useGameState(): GameState {
  return useSyncExternalStore(subscribe, getState);
}
