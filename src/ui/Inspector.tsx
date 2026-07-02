import { KINDS, THEMES, getDef } from '../core/catalog';
import { canPlace } from '../core/grid';
import { removeModule, resizePlacement, select, setPlacementTheme } from '../core/actions';
import { useGameState } from './hooks';

/**
 * Selected-module panel: shows what it is, and lets you restyle it, swap its
 * size (same kind, same spot), or delete it. Moving is direct: drag the module.
 */
export function Inspector() {
  const { selectedId, placements } = useGameState();
  const placement = placements.find((p) => p.id === selectedId);
  if (!placement) return null;
  const def = getDef(placement.defId);
  const kind = KINDS.find((k) => k.id === def?.kind);
  if (!def || !kind) return null;

  return (
    <div className="inspector">
      <div className="inspector-head">
        <div>
          <div className="inspector-name">{kind.name}</div>
          <div className="inspector-blurb">{kind.blurb}</div>
        </div>
        <button className="btn icon" onClick={() => select(null)} title="Close" aria-label="Close">
          ✕
        </button>
      </div>
      <div className="inspector-row">
        <span className="inspector-label">Style</span>
        <div className="dot-row">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={t.id === placement.theme ? 'theme-dot active' : 'theme-dot'}
              style={{ ['--swatch' as string]: t.palette.accent }}
              onClick={() => setPlacementTheme(placement.id, t.id)}
              title={t.name}
              aria-label={`Style: ${t.name}`}
            />
          ))}
        </div>
      </div>
      {kind.sizes.length > 1 && (
        <div className="inspector-row">
          <span className="inspector-label">Size</span>
          <div className="size-row">
            {kind.sizes.map((s) => {
              const id = `${kind.id}_${s.w}x${s.h}`;
              const target = getDef(id)!;
              const fits =
                id === placement.defId ||
                canPlace(placements, target, placement.x, placement.y, placement.id);
              return (
                <button
                  key={id}
                  className={id === placement.defId ? 'size-chip active' : 'size-chip'}
                  disabled={!fits}
                  title={fits ? `Make it ${s.w}×${s.h}` : "Doesn't fit here"}
                  onClick={() => resizePlacement(placement.id, id)}
                >
                  {s.w}×{s.h}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="inspector-actions">
        <span className="inspector-tip">Drag the room to move it</span>
        <button className="btn danger" onClick={() => removeModule(placement.id)}>
          🗑 Remove
        </button>
      </div>
    </div>
  );
}
