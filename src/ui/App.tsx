import { useEffect, useRef, useState } from 'react';
import { loadBase, removeModule } from '../core/actions';
import { getState } from '../core/store';
import type { SaveFileV2 } from '../core/types';
import { redo, undo } from '../core/undo';
import { attachPointerController } from '../input/pointerController';
import { initRenderer } from '../render/renderer';
import { deserialize, loadAutosave, startAutosave } from '../persistence/save';
import { decodeShare, shareCodeFromHash } from '../persistence/share';
import { useGameState } from './hooks';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { EnvironmentPicker } from './EnvironmentPicker';
import { Inspector } from './Inspector';

// Restore before first render so returning players skip the start screen.
loadAutosave();

export function App() {
  const state = useGameState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // A base arriving via share link, awaiting the player's OK to replace theirs.
  const [pendingShare, setPendingShare] = useState<SaveFileV2 | null>(null);

  useEffect(() => {
    const code = shareCodeFromHash(location.hash);
    if (!code) return;
    history.replaceState(null, '', location.pathname + location.search);
    void decodeShare(code)
      .then((json) => {
        const { save } = deserialize(json);
        if (getState().placements.length > 0) {
          setPendingShare(save); // don't silently clobber their base
        } else {
          loadBase(save.baseName, save.environmentId, save.placements);
        }
      })
      .catch(() => {
        // Mangled link — ignore and start normally.
      });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const stopRenderer = initRenderer(canvas);
    const stopPointer = attachPointerController(canvas);
    const stopAutosave = startAutosave();

    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && getState().selectedId) {
        removeModule(getState().selectedId!);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      stopAutosave();
      stopPointer();
      stopRenderer();
    };
  }, []);

  return (
    <div className="app">
      <TopBar />
      <div className="main">
        <div className="canvas-wrap">
          <canvas ref={canvasRef} className="world" />
          {state.placements.length === 0 && !state.needsEnvironmentPick && (
            <div className="hint">Drag a room from the catalog into the dirt to start building!</div>
          )}
          <Inspector />
        </div>
        <Sidebar canvasRef={canvasRef} />
      </div>
      {state.needsEnvironmentPick && !pendingShare && <EnvironmentPicker />}
      {pendingShare && (
        <div className="confirm-backdrop">
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-title">Open shared base?</div>
            <p className="confirm-text">
              Someone sent you “{pendingShare.baseName}” ({pendingShare.placements.length} rooms).
              Opening it replaces your current base — use ⬇ Save file first if you want to keep
              yours.
            </p>
            <div className="confirm-actions">
              <button className="btn" onClick={() => setPendingShare(null)}>
                Keep mine
              </button>
              <button
                className="btn active"
                onClick={() => {
                  loadBase(pendingShare.baseName, pendingShare.environmentId, pendingShare.placements);
                  setPendingShare(null);
                }}
              >
                Open it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
