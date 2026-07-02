import { useMemo, useState, type RefObject } from 'react';
import { CATEGORIES, KINDS, THEMES } from '../core/catalog';
import type { KindDef } from '../core/types';
import { setActiveTheme } from '../core/actions';
import { beginCatalogDrag } from '../input/catalogDrag';
import { getThumbnailURL } from '../render/sprites';
import { useGameState } from './hooks';
import { getDef } from '../core/catalog';

type SortKey = 'name' | 'size' | 'category';

const RARITY_LABEL: Record<string, string> = {
  common: '',
  uncommon: '◆ uncommon',
  rare: '★ rare',
};

/**
 * One card per module KIND; the size variant is chosen with chips on the card
 * and the style comes from the global theme selector. Keeps the list short.
 */
export function Sidebar({ canvasRef }: { canvasRef: RefObject<HTMLCanvasElement> }) {
  const { activeTheme } = useGameState();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SortKey>('category');
  // Chosen size per kind (defaults to the kind's first/smallest size).
  const [sizeChoice, setSizeChoice] = useState<Record<string, string>>({});

  const kinds = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = KINDS.filter((k) => {
      if (category !== 'all' && k.category !== category) return false;
      if (!q) return true;
      return k.name.toLowerCase().includes(q) || k.tags.some((t) => t.toLowerCase().includes(q));
    });
    const by: Record<SortKey, (a: KindDef, b: KindDef) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      size: (a, b) =>
        a.sizes[0].w * a.sizes[0].h - b.sizes[0].w * b.sizes[0].h || a.name.localeCompare(b.name),
      category: (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
    };
    return [...filtered].sort(by[sort]);
  }, [search, category, sort]);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="theme-row">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={t.id === activeTheme ? 'theme-chip active' : 'theme-chip'}
              style={{ ['--swatch' as string]: t.palette.accent }}
              onClick={() => setActiveTheme(t.id)}
              title={t.blurb}
            >
              {t.name}
            </button>
          ))}
        </div>
        <input
          className="search"
          placeholder="Search rooms…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-row">
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort">
            <option value="category">By category</option>
            <option value="name">By name</option>
            <option value="size">By size</option>
          </select>
        </div>
      </div>
      <div className="card-list">
        {kinds.map((kind) => (
          <KindCard
            key={kind.id}
            kind={kind}
            theme={activeTheme}
            chosenDefId={sizeChoice[kind.id]}
            onChooseSize={(defId) => setSizeChoice((s) => ({ ...s, [kind.id]: defId }))}
            canvasRef={canvasRef}
          />
        ))}
        {kinds.length === 0 && <div className="empty-list">No rooms match. Try another search!</div>}
      </div>
    </div>
  );
}

function KindCard({
  kind,
  theme,
  chosenDefId,
  onChooseSize,
  canvasRef,
}: {
  kind: KindDef;
  theme: string;
  chosenDefId: string | undefined;
  onChooseSize: (defId: string) => void;
  canvasRef: RefObject<HTMLCanvasElement>;
}) {
  const defId = chosenDefId ?? `${kind.id}_${kind.sizes[0].w}x${kind.sizes[0].h}`;
  const def = getDef(defId)!;
  return (
    <div className={`card rarity-${kind.rarity}`} title={`${kind.blurb} — drag me into the base!`}>
      <div
        className="card-drag-zone"
        onPointerDown={(e) => {
          if (canvasRef.current) beginCatalogDrag(def.id, e.nativeEvent, canvasRef.current);
        }}
      >
        <img className="card-thumb" src={getThumbnailURL(def, theme)} alt="" draggable={false} />
        <div className="card-info">
          <div className="card-name">{kind.name}</div>
          <div className="card-meta">
            {RARITY_LABEL[kind.rarity] ? (
              <span className={`rarity ${kind.rarity}`}>{RARITY_LABEL[kind.rarity]}</span>
            ) : (
              <span>{kind.blurb}</span>
            )}
          </div>
        </div>
      </div>
      {kind.sizes.length > 1 && (
        <div className="size-row">
          {kind.sizes.map((s) => {
            const id = `${kind.id}_${s.w}x${s.h}`;
            return (
              <button
                key={id}
                className={id === defId ? 'size-chip active' : 'size-chip'}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onChooseSize(id)}
              >
                {s.w}×{s.h}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
