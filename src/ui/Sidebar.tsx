import { useMemo, useState, type RefObject } from 'react';
import { CATEGORIES, KINDS, THEMES, getDef } from '../core/catalog';
import type { KindDef } from '../core/types';
import { beginCatalogDrag } from '../input/catalogDrag';
import { getThumbnailURL } from '../render/sprites';
import { sizeLabel } from './format';

type SortKey = 'name' | 'size' | 'category';

const RARITY_LABEL: Record<string, string> = {
  common: '○ common',
  uncommon: '◆ uncommon',
  rare: '★ rare',
};

/**
 * One card per module KIND with two matching ◀ ▶ flippers: STYLE (cycles the
 * 5 themes, thumbnail restyles live) and SIZE (cycles the kind's size tiers).
 * Flow: flip to the size and style you want, then drag the card in.
 */
export function Sidebar({ canvasRef }: { canvasRef: RefObject<HTMLCanvasElement> }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SortKey>('name');
  const [sizeChoice, setSizeChoice] = useState<Record<string, number>>({});
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

  const cycle = (record: Record<string, number>, key: string, dir: number, len: number, fallback: number) => ({
    ...record,
    [key]: (((record[key] ?? fallback) + dir) % len + len) % len,
  });

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
            <option value="name">A → Z</option>
            <option value="category">By category</option>
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
            sizeIdx={sizeChoice[kind.id] ?? 0}
            onFlipStyle={(dir) =>
              setStyleChoice((s) => cycle(s, kind.id, dir, THEMES.length, i % THEMES.length))
            }
            onFlipSize={(dir) => setSizeChoice((s) => cycle(s, kind.id, dir, kind.sizes.length, 0))}
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
  sizeIdx,
  onFlipStyle,
  onFlipSize,
  canvasRef,
}: {
  kind: KindDef;
  styleIdx: number;
  sizeIdx: number;
  onFlipStyle: (dir: 1 | -1) => void;
  onFlipSize: (dir: 1 | -1) => void;
  canvasRef: RefObject<HTMLCanvasElement>;
}) {
  const theme = THEMES[styleIdx];
  const size = kind.sizes[sizeIdx];
  const def = getDef(`${kind.id}_${size.w}x${size.h}`)!;
  const stop = (e: React.PointerEvent) => e.stopPropagation();
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
            <span className={`rarity ${kind.rarity}`}>{RARITY_LABEL[kind.rarity]}</span>
          </div>
        </div>
      </div>
      <div className="card-controls">
        <div className="flipper">
          <button className="flip-btn" onPointerDown={stop} onClick={() => onFlipStyle(-1)} aria-label="Previous style">
            ◀
          </button>
          <span className="flip-value" style={{ ['--swatch' as string]: theme.palette.accent }}>
            {theme.name}
          </span>
          <button className="flip-btn" onPointerDown={stop} onClick={() => onFlipStyle(1)} aria-label="Next style">
            ▶
          </button>
        </div>
        <div className="flipper">
          <button
            className="flip-btn"
            onPointerDown={stop}
            onClick={() => onFlipSize(-1)}
            disabled={kind.sizes.length < 2}
            aria-label="Smaller size"
          >
            ◀
          </button>
          <span className="flip-value flip-size" title={`${size.w}×${size.h} cells`}>
            {sizeLabel(size.w, size.h)}
          </span>
          <button
            className="flip-btn"
            onPointerDown={stop}
            onClick={() => onFlipSize(1)}
            disabled={kind.sizes.length < 2}
            aria-label="Bigger size"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}
