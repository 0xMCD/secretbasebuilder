/**
 * All mutations to game state go through these functions. Undoable actions
 * call recordUndo() first; persistence auto-saves by subscribing to the store.
 */
import type { DefId, EnvironmentId, Placement, ThemeId } from './types';
import { getDef, getEnvironment, getTheme } from './catalog';
import { canPlace } from './grid';
import { getState, setState } from './store';
import { recordUndo, resetUndo } from './undo';

let uidCounter = 0;
function uid(): string {
  return `p${Date.now().toString(36)}_${(uidCounter++).toString(36)}`;
}

/** Places a module. Returns the new placement, or null if invalid. */
export function placeModule(
  defId: DefId,
  theme: ThemeId,
  x: number,
  y: number,
): Placement | null {
  const def = getDef(defId);
  if (!def || !getTheme(theme)) return null;
  const { placements } = getState();
  if (!canPlace(placements, def, x, y)) return null;
  recordUndo();
  const placement: Placement = { id: uid(), defId, theme, x, y };
  setState({ placements: [...placements, placement], selectedId: placement.id });
  return placement;
}

/** Moves an existing placement. Returns false if the target spot is invalid. */
export function moveModule(id: string, x: number, y: number): boolean {
  const { placements } = getState();
  const placement = placements.find((p) => p.id === id);
  if (!placement) return false;
  if (placement.x === x && placement.y === y) return true;
  const def = getDef(placement.defId);
  if (!def || !canPlace(placements, def, x, y, id)) return false;
  recordUndo();
  setState({
    placements: placements.map((p) => (p.id === id ? { ...p, x, y } : p)),
  });
  return true;
}

export function removeModule(id: string): void {
  const { placements, selectedId } = getState();
  if (!placements.some((p) => p.id === id)) return;
  recordUndo();
  setState({
    placements: placements.filter((p) => p.id !== id),
    selectedId: selectedId === id ? null : selectedId,
  });
}

/** Restyles one placed module (from the selection inspector). */
export function setPlacementTheme(id: string, themeId: ThemeId): void {
  if (!getTheme(themeId)) return;
  const { placements } = getState();
  const placement = placements.find((p) => p.id === id);
  if (!placement || placement.theme === themeId) return;
  recordUndo();
  setState({
    placements: placements.map((p) => (p.id === id ? { ...p, theme: themeId } : p)),
  });
}

/**
 * Swaps a placement to another size of the SAME kind, keeping its top-left
 * anchor. Returns false if the new footprint doesn't fit there.
 */
export function resizePlacement(id: string, newDefId: DefId): boolean {
  const { placements } = getState();
  const placement = placements.find((p) => p.id === id);
  if (!placement) return false;
  if (placement.defId === newDefId) return true;
  const oldDef = getDef(placement.defId);
  const newDef = getDef(newDefId);
  if (!oldDef || !newDef || oldDef.kind !== newDef.kind) return false;
  if (!canPlace(placements, newDef, placement.x, placement.y, id)) return false;
  recordUndo();
  setState({
    placements: placements.map((p) => (p.id === id ? { ...p, defId: newDefId } : p)),
  });
  return true;
}

export function clearBase(): void {
  if (getState().placements.length === 0) return;
  recordUndo();
  setState({ placements: [], selectedId: null });
}

export function setEnvironment(environmentId: EnvironmentId): void {
  if (!getEnvironment(environmentId)) return;
  if (getState().environmentId === environmentId) return;
  recordUndo();
  setState({ environmentId });
}

/** Confirms the start-screen environment pick (not undoable). */
export function confirmEnvironmentPick(environmentId: EnvironmentId): void {
  if (!getEnvironment(environmentId)) return;
  setState({ environmentId, needsEnvironmentPick: false });
}

export function setBaseName(baseName: string): void {
  setState({ baseName });
}

// --- UI-only state (not undoable) ---

export function setOverlay(overlayOn: boolean): void {
  setState({ overlayOn });
}

export function setActiveTheme(themeId: ThemeId): void {
  if (!getTheme(themeId)) return;
  setState({ activeTheme: themeId });
}

export function select(id: string | null): void {
  setState({ selectedId: id });
}

/** Replaces base content wholesale (import / load). Clears undo history. */
export function loadBase(
  baseName: string,
  environmentId: EnvironmentId,
  placements: Placement[],
): void {
  resetUndo();
  setState({
    baseName,
    environmentId,
    placements,
    selectedId: null,
    needsEnvironmentPick: false,
  });
}
