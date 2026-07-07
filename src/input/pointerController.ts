/**
 * Canvas gestures via Pointer Events (mouse + touch unified):
 *   drag empty space → pan · drag a placed module → move it · tap → select
 *   wheel / two-finger pinch → zoom
 */
import { placementAt } from '../core/grid';
import { getState } from '../core/store';
import { moveModule, select } from '../core/actions';
import { triggerReaction } from '../render/reactions';
import { panBy, screenToCell, zoomAt } from '../render/camera';
import { getCamera, getGhost, getViewSize, requestRedraw, setGhost } from '../render/renderer';

const TAP_SLOP = 6; // px before a press becomes a drag

interface PointerInfo {
  x: number;
  y: number;
}

export function attachPointerController(canvas: HTMLCanvasElement): () => void {
  const pointers = new Map<number, PointerInfo>();
  let mode: 'idle' | 'pan' | 'move' | 'pinch' = 'idle';
  let downX = 0;
  let downY = 0;
  let movedPastSlop = false;
  let movingId: string | null = null;
  let grabDx = 0; // grab offset in cells, keeps the module under the finger
  let grabDy = 0;
  let pinchDist = 0;

  const pos = (e: PointerEvent): PointerInfo => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: PointerEvent) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, pos(e));
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      mode = 'pinch';
      setGhost(null);
      return;
    }
    const p = pos(e);
    downX = p.x;
    downY = p.y;
    movedPastSlop = false;
    mode = 'idle';
    const [cx, cy] = screenToCell(getCamera(), p.x, p.y);
    const hit = placementAt(getState().placements, cx, cy);
    if (hit) {
      movingId = hit.id;
      grabDx = cx - hit.x;
      grabDy = cy - hit.y;
    } else {
      movingId = null;
    }
  };

  const onMove = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId)!;
    const p = pos(e);
    pointers.set(e.pointerId, p);

    if (mode === 'pinch' && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const { w, h } = getViewSize();
      if (pinchDist > 0) zoomAt(getCamera(), midX, midY, dist / pinchDist, w, h);
      pinchDist = dist;
      requestRedraw();
      return;
    }

    if (!movedPastSlop && Math.hypot(p.x - downX, p.y - downY) > TAP_SLOP) {
      movedPastSlop = true;
      if (movingId) {
        const placement = getState().placements.find((pl) => pl.id === movingId);
        if (placement) {
          mode = 'move';
          setGhost({
            defId: placement.defId,
            theme: placement.theme,
            cx: placement.x,
            cy: placement.y,
            moveId: placement.id,
          });
        }
      } else {
        mode = 'pan';
      }
    }

    if (mode === 'pan') {
      const { w, h } = getViewSize();
      panBy(getCamera(), p.x - prev.x, p.y - prev.y, w, h);
      requestRedraw();
    } else if (mode === 'move') {
      const [cx, cy] = screenToCell(getCamera(), p.x, p.y);
      const g = getGhost();
      if (g) setGhost({ ...g, cx: cx - grabDx, cy: cy - grabDy });
    }
  };

  const onUp = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);

    if (mode === 'pinch') {
      if (pointers.size < 2) mode = pointers.size === 1 ? 'pan' : 'idle';
      return;
    }

    if (mode === 'move') {
      const g = getGhost();
      if (g?.moveId) {
        moveModule(g.moveId, g.cx, g.cy); // no-op if the drop spot is invalid
        select(g.moveId);
      }
      setGhost(null);
    } else if (!movedPastSlop) {
      // Tap: select module under pointer, or clear selection — and if the
      // module has a tap reaction (rocket test-fire, disco party, feeding
      // time, bounce show), set it off.
      select(movingId);
      if (movingId) {
        triggerReaction(getState().placements.find((p) => p.id === movingId));
      }
    }
    mode = 'idle';
    movingId = null;
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const { w, h } = getViewSize();
    const factor = Math.pow(1.0015, -e.deltaY);
    zoomAt(getCamera(), e.clientX - rect.left, e.clientY - rect.top, factor, w, h);
    requestRedraw();
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.style.touchAction = 'none'; // we own all gestures

  return () => {
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onUp);
    canvas.removeEventListener('wheel', onWheel);
  };
}
