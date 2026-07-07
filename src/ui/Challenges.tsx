import { useEffect, useRef, useState } from 'react';
import { CHALLENGES, checkCondition, describeCondition, type Challenge } from '../core/challenges';
import { stampChallenges } from '../core/actions';
import { useGameState } from './hooks';

/**
 * Blueprint challenges: 🎯 button (with earned count), the card panel, the
 * auto-stamper and the completion toast. Cards are prompts, not gates —
 * conditions show live ✓/✗ against the current base; completing one stamps
 * a badge that stays stamped forever (persisted in the save).
 */
export function ChallengesButton() {
  const state = useGameState();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<Challenge | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // Auto-stamp newly satisfied cards whenever the base changes.
  useEffect(() => {
    if (state.needsEnvironmentPick) return;
    const fresh = CHALLENGES.filter(
      (ch) =>
        !state.completedChallenges.includes(ch.id) &&
        ch.conditions.every((c) => checkCondition(c, state.placements)),
    );
    if (fresh.length > 0) {
      // Deferred a tick: child effects run before App's, so stamping
      // synchronously on mount would land before autosave subscribes and
      // the badge write would be skipped until the next edit.
      const t = setTimeout(() => {
        stampChallenges(fresh.map((ch) => ch.id));
        setToast(fresh[0]);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 4000);
      }, 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.placements]);

  const earned = state.completedChallenges.length;
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)} title="Building challenges — earn badges!">
        🎯 Challenges{earned > 0 ? ` ${earned}/${CHALLENGES.length}` : ''}
      </button>
      {toast && (
        <div className="challenge-toast" onClick={() => setToast(null)}>
          🎉 Challenge complete! <b>{toast.emoji} {toast.name}</b>
        </div>
      )}
      {open && <ChallengesPanel onClose={() => setOpen(false)} />}
    </>
  );
}

function ChallengesPanel({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  return (
    <div className="confirm-backdrop" onClick={onClose}>
      <div className="challenge-panel" onClick={(e) => e.stopPropagation()}>
        <div className="challenge-head">
          <div className="confirm-title">🎯 Building challenges</div>
          <button className="btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="confirm-text">
          Ideas for your next build. Finish one and its badge is yours forever — no rush, no rules.
        </p>
        <div className="challenge-grid">
          {CHALLENGES.map((ch) => {
            const stamped = state.completedChallenges.includes(ch.id);
            return (
              <div key={ch.id} className={stamped ? 'challenge-card stamped' : 'challenge-card'}>
                <div className="challenge-name">
                  {ch.emoji} {ch.name}
                  {stamped && <span className="challenge-badge">★ DONE</span>}
                </div>
                <div className="challenge-blurb">{ch.blurb}</div>
                <ul className="challenge-list">
                  {ch.conditions.map((c, i) => {
                    const ok = checkCondition(c, state.placements);
                    return (
                      <li key={i} className={ok ? 'ok' : ''}>
                        {ok ? '✓' : '○'} {describeCondition(c)}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
