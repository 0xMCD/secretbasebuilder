import { useEffect, useRef } from 'react';
import { removeModule } from '../core/actions';
import { getState } from '../core/store';
import { redo, undo } from '../core/undo';
import { attachPointerController } from '../input/pointerController';
import { initRenderer } from '../render/renderer';
import { loadAutosave, startAutosave } from '../persistence/save';
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
      {state.needsEnvironmentPick && <EnvironmentPicker />}
    </div>
  );
}
