/**
 * Custom drag-from-sidebar (HTML5 drag-and-drop doesn't work on touch).
 * A floating thumbnail follows the pointer; over the canvas it becomes a
 * grid-snapped ghost; releasing places the module (centered on the pointer).
 *
 * Touch coexistence: cards use `touch-action: pan-y` (pan-x in the phone
 * bottom-sheet), so scrolling the list stays a native browser gesture. When
 * the browser claims the gesture it fires pointercancel — that ABORTS the
 * drag (never places). Only a drag the browser leaves to us (toward the
 * canvas) can place a module.
 */
import type { DefId, ThemeId } from '../core/types';
import { getDef } from '../core/catalog';
import { placeModule } from '../core/actions';
import { screenToCell } from '../render/camera';
import { getCamera, setGhost } from '../render/renderer';
import { getThumbnailURL } from '../render/sprites';

export function beginCatalogDrag(
  defId: DefId,
  theme: ThemeId,
  e: PointerEvent,
  canvas: HTMLCanvasElement,
): void {
  const def = getDef(defId);
  if (!def) return;
  e.preventDefault();

  // Floating preview that follows the pointer until it's over the canvas.
  const preview = document.createElement('img');
  preview.src = getThumbnailURL(def, theme);
  preview.style.cssText =
    'position:fixed;pointer-events:none;z-index:1000;opacity:0.85;image-rendering:pixelated;height:40px;transform:translate(-50%,-50%);';
  document.body.appendChild(preview);

  const cellFor = (ev: PointerEvent): [number, number] | null => {
    const rect = canvas.getBoundingClientRect();
    const sx = ev.clientX - rect.left;
    const sy = ev.clientY - rect.top;
    if (sx < 0 || sy < 0 || sx > rect.width || sy > rect.height) return null;
    const [cx, cy] = screenToCell(getCamera(), sx, sy);
    // Center the module footprint on the pointer.
    return [cx - Math.floor((def.w - 1) / 2), cy - Math.floor((def.h - 1) / 2)];
  };

  const onMove = (ev: PointerEvent) => {
    preview.style.left = `${ev.clientX}px`;
    preview.style.top = `${ev.clientY}px`;
    const cell = cellFor(ev);
    if (cell) {
      preview.style.display = 'none'; // the canvas ghost takes over
      setGhost({ defId, theme, cx: cell[0], cy: cell[1] });
    } else {
      preview.style.display = '';
      setGhost(null);
    }
  };

  const cleanup = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    preview.remove();
    setGhost(null);
  };

  const onUp = (ev: PointerEvent) => {
    const cell = cellFor(ev);
    cleanup();
    if (cell) placeModule(defId, theme, cell[0], cell[1]); // no-op if invalid spot
  };

  /** Browser took the gesture over (e.g. the list started scrolling). */
  const onCancel = () => cleanup();

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);
  onMove(e);
}
