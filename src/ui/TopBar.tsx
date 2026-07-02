import { useRef } from 'react';
import { ENVIRONMENTS } from '../core/catalog';
import { clearBase, setBaseName, setEnvironment, setOverlay } from '../core/actions';
import { canRedo, canUndo, redo, undo } from '../core/undo';
import { exportBase, importBase } from '../persistence/save';
import { useGameState } from './hooks';

export function TopBar() {
  const state = useGameState();
  const fileRef = useRef<HTMLInputElement>(null);

  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const skipped = importBase(await file.text());
      if (skipped > 0) alert(`Base loaded! (${skipped} unknown module(s) were skipped.)`);
    } catch {
      alert("That file doesn't look like a Secret Base save.");
    }
  };

  return (
    <div className="topbar">
      <span className="topbar-logo">🕵️</span>
      <input
        className="basename"
        value={state.baseName}
        onChange={(e) => setBaseName(e.target.value)}
        maxLength={40}
        aria-label="Base name"
      />
      <select
        className="env-select"
        value={state.environmentId}
        onChange={(e) => setEnvironment(e.target.value)}
        aria-label="Environment"
      >
        {ENVIRONMENTS.map((env) => (
          <option key={env.id} value={env.id}>
            {env.name}
          </option>
        ))}
      </select>
      <div className="topbar-spacer" />
      <button
        className={state.overlayOn ? 'btn active' : 'btn'}
        onClick={() => setOverlay(!state.overlayOn)}
        title="Show room names"
      >
        🏷 Labels
      </button>
      <button className="btn" onClick={undo} disabled={!canUndo()} title="Undo (Ctrl+Z)">
        ↩
      </button>
      <button className="btn" onClick={redo} disabled={!canRedo()} title="Redo (Ctrl+Y)">
        ↪
      </button>
      <button className="btn" onClick={exportBase} title="Download this base as a file">
        ⬇ Save file
      </button>
      <button className="btn" onClick={() => fileRef.current?.click()} title="Load a base file">
        ⬆ Load
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          void onImportFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <button
        className="btn danger"
        onClick={() => {
          if (window.confirm('Clear the whole base? (You can undo this.)')) clearBase();
        }}
      >
        🗑 Clear
      </button>
    </div>
  );
}
