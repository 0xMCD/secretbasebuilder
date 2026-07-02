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
 * One card per module KIND with two compact dropdowns: STYLE (the 5 themes,
 * thumbnail restyles live) and SIZE (the kind's size tiers). Native selects
 * keep the card slim and get free full-screen pickers on touch devices.
 * Flow: pick the size and style you want, then drag the card in.
 */
export function Sidebar({ canvasRef }: { canvasRef: RefObject<HTMLCanvasElement> }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SortKey>('name');
  const [sizeChoice, setSizeChoice] = useState<Record<string, string>>({});
  // Style per kind. Cards start on varied styles so the mix shows off.
  const [styleChoice, setStyleChoice] = useState<Record<string, string>>({});

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
            themeId={styleChoice[kind.id] ?? THEMES[i % THEMES.length].id}
            defId={sizeChoice[kind.id] ?? `${kind.id}_${kind.sizes[0].w}x${kind.sizes[0].h}`}
            onChooseStyle={(themeId) => setStyleChoice((s) => ({ ...s, [kind.id]: themeId }))}
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
  themeId,
  defId,
  onChooseStyle,
  onChooseSize,
  canvasRef,
}: {
  kind: KindDef;
  themeId: string;
  defId: string;
  onChooseStyle: (themeId: string) => void;
  onChooseSize: (defId: string) => void;
  canvasRef: RefObject<HTMLCanvasElement>;
}) {
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const def = getDef(defId)!;
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
        <select
          className="card-select"
          value={theme.id}
          onChange={(e) => onChooseStyle(e.target.value)}
          onPointerDown={stop}
          style={{ borderBottomColor: theme.palette.accent }}
          aria-label="Style"
        >
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          className="card-select"
          value={defId}
          onChange={(e) => onChooseSize(e.target.value)}
          onPointerDown={stop}
          disabled={kind.sizes.length < 2}
          aria-label="Size"
        >
          {kind.sizes.map((s) => {
            const id = `${kind.id}_${s.w}x${s.h}`;
            return (
              <option key={id} value={id}>
                {sizeLabel(s.w, s.h)} · {s.w}×{s.h}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}
