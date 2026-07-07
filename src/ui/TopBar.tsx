import { useRef, useState } from 'react';
import { ENVIRONMENTS } from '../core/catalog';
import { setBaseName, setEnvironment, setOverlay, startOver } from '../core/actions';
import { getState } from '../core/store';
import { canRedo, canUndo, redo, undo } from '../core/undo';
import { clearAutosave, exportBase, importBase, serialize } from '../persistence/save';
import { encodeShare, shareUrl } from '../persistence/share';
import { downloadSnapshot } from '../render/snapshot';
import { ChallengesButton } from './Challenges';
import { useGameState } from './hooks';

export function TopBar() {
  const state = useGameState();
  const fileRef = useRef<HTMLInputElement>(null);
  // In-app confirm dialog: window.confirm() is silently blocked in sandboxed
  // iframes (e.g. the hosted artifact build), so never rely on it.
  const [confirmingClear, setConfirmingClear] = useState(false);
  // Share: 'copied' flashes on the button; 'show' opens a manual-copy dialog
  // (clipboard access can be blocked in sandboxed iframes).
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'show'>('idle');
  const [shareLink, setShareLink] = useState('');

  const onShare = async () => {
    // Badges are earned, not shared — strip them from the share code.
    const url = shareUrl(await encodeShare({ ...serialize(getState()), completedChallenges: [] }));
    setShareLink(url);
    try {
      await navigator.clipboard.writeText(url);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2000);
    } catch {
      setShareState('show');
    }
  };

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
      <span className="wordmark">
        SECRET BASE<br />BUILDER
      </span>
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
      <ChallengesButton />
      <button
        className="btn"
        onClick={() => void onShare()}
        disabled={state.placements.length === 0}
        title="Copy a link that opens this exact base"
      >
        {shareState === 'copied' ? '✓ Copied!' : '🔗 Share'}
      </button>
      <button
        className="btn"
        onClick={downloadSnapshot}
        disabled={state.placements.length === 0}
        title="Download a picture of your base to save or print"
      >
        📸 Photo
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
      <button className="btn danger" onClick={() => setConfirmingClear(true)}>
        🗑 Clear
      </button>
      {shareState === 'show' && (
        <div className="confirm-backdrop" onClick={() => setShareState('idle')}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-title">Share this base</div>
            <p className="confirm-text">Copy this link — opening it loads your base anywhere:</p>
            <input
              className="share-url"
              readOnly
              value={shareLink}
              onFocus={(e) => e.target.select()}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <div className="confirm-actions">
              <button className="btn" onClick={() => setShareState('idle')}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmingClear && (
        <div className="confirm-backdrop" onClick={() => setConfirmingClear(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-title">Start over?</div>
            <p className="confirm-text">
              This clears your whole base and takes you back to the start screen. There's no undo
              for this one!
            </p>
            <div className="confirm-actions">
              <button className="btn" onClick={() => setConfirmingClear(false)}>
                Keep building
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  setConfirmingClear(false);
                  clearAutosave();
                  startOver();
                }}
              >
                🗑 Start over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
