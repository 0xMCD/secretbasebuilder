import { useMemo, useState, type RefObject } from 'react';
import { CATEGORIES, KINDS, THEMES, getDef } from '../core/catalog';
import type { KindDef } from '../core/types';
import { beginCatalogDrag } from '../input/catalogDrag';
import { getThumbnailURL } from '../render/sprites';
import { sizeLabel } from './format';

type SortKey = 'name' | 'size' | 'category';

const RARITY_LABEL: Record<string, string> = {
  common: '',
  uncommon: '◆ uncommon',
  rare: '★ rare',
};

/**
 * One card per module KIND. Size tiers (S/M/L/XL…) are always visible as
 * chips; the ◀ ▶ flipper cycles the STYLE for that card (thumbnail follows).
 * Flow: "I want an L bedroom → flip styles until I like one → drag it in."
 */
export function Sidebar({ canvasRef }: { canvasRef: RefObject<HTMLCanvasElement> }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SortKey>('category');
  const [sizeChoice, setSizeChoice] = useState<Record<string, string>>({});
  // Style index per kind. Cards start on varied styles so the mix shows off.
  const [styleChoice, setStyleChoice] = useState<Record<string, number>>({});

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
        {kinds.map((kind, i) => (
          <KindCard
            key={kind.id}
            kind={kind}
            styleIdx={styleChoice[kind.id] ?? i % THEMES.length}
            onFlipStyle={(dir) =>
              setStyleChoice((s) => ({
                ...s,
                [kind.id]:
                  (((s[kind.id] ?? i % THEMES.length) + dir) % THEMES.length + THEMES.length) %
                  THEMES.length,
              }))
            }
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
  styleIdx,
  onFlipStyle,
  chosenDefId,
  onChooseSize,
  canvasRef,
}: {
  kind: KindDef;
  styleIdx: number;
  onFlipStyle: (dir: 1 | -1) => void;
  chosenDefId: string | undefined;
  onChooseSize: (defId: string) => void;
  canvasRef: RefObject<HTMLCanvasElement>;
}) {
  const theme = THEMES[styleIdx];
  const defId = chosenDefId ?? `${kind.id}_${kind.sizes[0].w}x${kind.sizes[0].h}`;
  const def = getDef(defId)!;
  return (
    <div className={`card rarity-${kind.rarity}`} title={`${kind.blurb} — drag me into the base!`}>
      <div
        className="card-drag-zone"
        onPointerDown={(e) => {
          if (canvasRef.current) beginCatalogDrag(def.id, theme.id, e.nativeEvent, canvasRef.current);
        }}
      >
        <img className="card-thumb" src={getThumbnailURL(def, theme.id)} alt="" draggable={false} />
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
      <div className="card-controls">
        <div className="style-flipper">
          <button
            className="flip-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onFlipStyle(-1)}
            aria-label="Previous style"
          >
            ◀
          </button>
          <span className="style-name" style={{ ['--swatch' as string]: theme.palette.accent }}>
            {theme.name}
          </span>
          <button
            className="flip-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onFlipStyle(1)}
            aria-label="Next style"
          >
            ▶
          </button>
        </div>
        <div className="size-row">
          {kind.sizes.map((s) => {
            const id = `${kind.id}_${s.w}x${s.h}`;
            return (
              <button
                key={id}
                className={id === defId ? 'size-chip active' : 'size-chip'}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onChooseSize(id)}
                title={`${s.w}×${s.h} cells`}
              >
                {sizeLabel(s.w, s.h)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
